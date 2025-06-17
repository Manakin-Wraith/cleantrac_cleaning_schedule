from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.utils import timezone
from django.db.models import Q
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.http import HttpResponse
import io
from datetime import datetime, timedelta
import json
import traceback
import pandas as pd
import os

# ReportLab Imports
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import Paragraph, Spacer, Table, TableStyle, SimpleDocTemplate, PageBreak, Frame, PageTemplate, NextPageTemplate
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib import colors

from .models import DocumentTemplate, GeneratedDocument, TaskInstance, ThermometerVerificationRecord, TemperatureLog
from .document_template_serializers import DocumentTemplateSerializer, GeneratedDocumentSerializer
from .permissions import IsManagerForWriteOrAuthenticatedReadOnly

class DocumentTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing document templates.
    Only managers can create, update, or delete templates in their department.
    """
    serializer_class = DocumentTemplateSerializer
    permission_classes = [IsManagerForWriteOrAuthenticatedReadOnly]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return DocumentTemplate.objects.none()
            
        # Filter by template_type if provided
        template_type = self.request.query_params.get('template_type', None)
        queryset = DocumentTemplate.objects.all()
        
        if template_type:
            queryset = queryset.filter(template_type=template_type)
            
        # Superusers can see all templates
        if user.is_superuser:
            return queryset
        
        # Managers and staff can only see templates for their department
        try:
            if user.profile.department:
                return queryset.filter(department=user.profile.department)
            else:
                return DocumentTemplate.objects.none()
        except:
            return DocumentTemplate.objects.none()
    
    def perform_create(self, serializer):
        # Set created_by to the requesting user
        serializer.save(created_by=self.request.user)
        
    @action(detail=False, methods=['get'], url_path='by-department/(?P<department_id>[^/.]+)')
    def by_department(self, request, department_id=None):
        """
        Returns templates for a specific department.
        """
        templates = self.get_queryset().filter(department_id=department_id)
        serializer = self.get_serializer(templates, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'], url_path='types')
    def template_types(self, request):
        """
        Returns the available template types.
        """
        return Response(dict(DocumentTemplate.TEMPLATE_TYPE_CHOICES))
        
    @action(detail=True, methods=['post'], url_path='preview')
    def preview_document(self, request, pk=None):
        """
        Generates a preview of the document with validation results.
        """
        template = self.get_object()
        parameters = request.data.get('parameters', {})
        
        # Validate parameters
        validation_results = self._validate_parameters(template, parameters)
        
        # Generate preview data based on template type
        preview_data = self._generate_preview_data(template, parameters)
        
        return Response({
            'preview_data': preview_data,
            'validation_results': validation_results
        })
    
    def _validate_parameters(self, template, parameters):
        """
        Validates the parameters for document generation.
        """
        validation_results = {
            'is_valid': True,
            'has_critical_issues': False,
            'checks': {}
        }
        
        # Check date range
        start_date = parameters.get('startDate')
        end_date = parameters.get('endDate')
        
        if not start_date or not end_date:
            validation_results['checks']['date_range'] = {
                'passed': False,
                'message': 'Start date and end date are required.',
                'is_critical': True
            }
            validation_results['is_valid'] = False
            validation_results['has_critical_issues'] = True
        else:
            try:
                start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
                end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
                
                if end_date < start_date:
                    validation_results['checks']['date_range'] = {
                        'passed': False,
                        'message': 'End date cannot be before start date.',
                        'is_critical': True
                    }
                    validation_results['is_valid'] = False
                    validation_results['has_critical_issues'] = True
                elif (end_date - start_date).days > 90:
                    validation_results['checks']['date_range'] = {
                        'passed': False,
                        'message': 'Date range exceeds 90 days. This may result in a very large document.',
                        'is_critical': False
                    }
                    validation_results['is_valid'] = False
                else:
                    validation_results['checks']['date_range'] = {
                        'passed': True,
                        'message': f'Date range is valid: {start_date} to {end_date}',
                        'is_critical': False
                    }
            except ValueError:
                validation_results['checks']['date_range'] = {
                    'passed': False,
                    'message': 'Invalid date format. Use YYYY-MM-DD.',
                    'is_critical': True
                }
                validation_results['is_valid'] = False
                validation_results['has_critical_issues'] = True
        
        # Check data availability based on template type
        if template.template_type == 'temperature':
            has_data = self._check_temperature_data_availability(template, parameters)
            validation_results['checks']['temperature_data'] = {
                'passed': has_data,
                'message': 'Temperature data is available.' if has_data else 'No temperature data found for the selected period.',
                'is_critical': False
            }
            if not has_data:
                validation_results['is_valid'] = False
        
        elif template.template_type == 'cleaning':
            has_data = self._check_cleaning_data_availability(template, parameters)
            validation_results['checks']['cleaning_data'] = {
                'passed': has_data,
                'message': 'Cleaning task data is available.' if has_data else 'No cleaning task data found for the selected period.',
                'is_critical': False
            }
            if not has_data:
                validation_results['is_valid'] = False
        
        elif template.template_type == 'verification':
            has_data = self._check_verification_data_availability(template, parameters)
            validation_results['checks']['verification_data'] = {
                'passed': has_data,
                'message': 'Thermometer verification data is available.' if has_data else 'No thermometer verification data found for the selected period.',
                'is_critical': False
            }
            if not has_data:
                validation_results['is_valid'] = False
        
        return validation_results
    
    def _check_temperature_data_availability(self, template, parameters):
        """
        Check if temperature data is available for the given parameters.
        """
        try:
            start_date = datetime.strptime(parameters.get('startDate'), '%Y-%m-%d').date()
            end_date = datetime.strptime(parameters.get('endDate'), '%Y-%m-%d').date()
            
            # Check if there are any temperature logs in the date range
            count = TemperatureLog.objects.filter(
                log_datetime__date__gte=start_date,
                log_datetime__date__lte=end_date,
                department=template.department
            ).count()
            
            return count > 0
        except Exception as e:
            print(f"Error checking temperature data availability: {str(e)}")
            return False
            
    def _get_sample_temperature_logs(self, template, parameters):
        """
        Get sample temperature logs for preview.
        """
        try:
            start_date = datetime.strptime(parameters.get('startDate'), '%Y-%m-%d').date()
            end_date = datetime.strptime(parameters.get('endDate'), '%Y-%m-%d').date()
            
            # Get temperature logs for the specified date range and department
            logs = TemperatureLog.objects.filter(
                log_datetime__date__gte=start_date,
                log_datetime__date__lte=end_date,
                department=template.department
            ).select_related(
                'area_unit',
                'thermometer_used',
                'logged_by'
            ).order_by('-log_datetime')[:10]  # Limit to 10 logs for preview
            
            # Format logs for preview
            formatted_logs = []
            for log in logs:
                formatted_log = {
                    'date': log.log_datetime.strftime('%Y-%m-%d'),
                    'time': log.log_datetime.strftime('%H:%M'),
                    'area_name': log.area_unit.name,
                    'area_id': log.area_unit.id,
                    'time_period': log.get_time_period_display(),
                    'temperature': float(log.temperature_reading),
                    'thermometer': log.thermometer_used.serial_number,
                    'logged_by': log.logged_by.username,
                    'in_range': log.is_within_target_range(),
                }
                
                # Add target temperature range if available
                if log.area_unit.target_temperature_min is not None:
                    formatted_log['min_temp'] = float(log.area_unit.target_temperature_min)
                if log.area_unit.target_temperature_max is not None:
                    formatted_log['max_temp'] = float(log.area_unit.target_temperature_max)
                
                # Add corrective action if available
                if log.corrective_action:
                    formatted_log['corrective_action'] = log.corrective_action
                
                formatted_logs.append(formatted_log)
            
            # Generate summary statistics
            total_logs = len(formatted_logs)
            in_range_count = sum(1 for log in formatted_logs if log.get('in_range') is True)
            out_of_range_count = sum(1 for log in formatted_logs if log.get('in_range') is False)
            
            summary = {
                'total_readings': total_logs,
                'in_range_count': in_range_count,
                'out_of_range_count': out_of_range_count,
                'in_range_percentage': (in_range_count / total_logs * 100) if total_logs > 0 else 0,
                'out_of_range_percentage': (out_of_range_count / total_logs * 100) if total_logs > 0 else 0,
            }
            
            return formatted_logs, summary
        except Exception as e:
            print(f"Error getting sample temperature logs: {str(e)}")
            return [], {'total_readings': 0, 'in_range_count': 0, 'out_of_range_count': 0, 'in_range_percentage': 0, 'out_of_range_percentage': 0}
    
    def _check_cleaning_data_availability(self, template, parameters):
        """
        Check if cleaning task data is available for the given parameters.
        """
        try:
            start_date = datetime.strptime(parameters.get('startDate'), '%Y-%m-%d').date()
            end_date = datetime.strptime(parameters.get('endDate'), '%Y-%m-%d').date()
            
            # Check if there are any task instances in the date range
            count = TaskInstance.objects.filter(
                due_date__gte=start_date,
                due_date__lte=end_date,
                department=template.department,
                cleaning_item__isnull=False
            ).count()
            
            return count > 0
        except:
            return False
    
    def _check_verification_data_availability(self, template, parameters):
        """
        Check if thermometer verification data is available for the given parameters.
        """
        try:
            start_date = datetime.strptime(parameters.get('startDate'), '%Y-%m-%d').date()
            end_date = datetime.strptime(parameters.get('endDate'), '%Y-%m-%d').date()
            
            # Check if there are any verification records in the date range
            count = ThermometerVerificationRecord.objects.filter(
                date_verified__gte=start_date,
                date_verified__lte=end_date,
                thermometer__department=template.department
            ).count()
            
            return count > 0
        except:
            return False
    
    def _generate_preview_data(self, template, parameters):
        """
        Generates preview data based on template type and parameters.
        """
        preview_data = {}
        
        # Generate preview data based on template type
        if template.template_type == 'verification':
            # Get sample verification records
            records = self._get_sample_verification_records(template, parameters)
            preview_data['verifications'] = records
            
        elif template.template_type == 'cleaning':
            # Get sample cleaning tasks
            tasks = self._get_sample_cleaning_tasks(template, parameters)
            preview_data['cleaning_tasks'] = tasks
            
        elif template.template_type == 'temperature':
            # Get sample temperature logs
            logs, summary = self._get_sample_temperature_logs(template, parameters)
            preview_data['temperature_logs'] = logs
            preview_data['temperature_summary'] = summary
        
        return preview_data
    
    def _get_sample_verification_records(self, template, parameters):
        """
        Get sample verification records for preview.
        """
        try:
            start_date = datetime.strptime(parameters.get('startDate'), '%Y-%m-%d').date()
            end_date = datetime.strptime(parameters.get('endDate'), '%Y-%m-%d').date()
            
            # Get verification records for the specified date range and department
            records = ThermometerVerificationRecord.objects.filter(
                date_verified__gte=start_date,
                date_verified__lte=end_date,
                thermometer__department=template.department
            ).select_related(
                'thermometer',
                'calibrated_by'
            ).order_by('-date_verified')[:10]  # Limit to 10 records for preview
            
            # Format records for preview
            formatted_records = []
            for record in records:
                formatted_record = {
                    'date': record.date_verified.strftime('%Y-%m-%d'),
                    'thermometer': record.thermometer.serial_number,
                    'verified_by': record.calibrated_by.username if record.calibrated_by else "Unknown",
                    'reading': f"{record.reading_after_verification}°C",
                    'calibrated_instrument': record.calibrated_instrument_no
                }
                
                formatted_records.append(formatted_record)
            
            return formatted_records
        except Exception as e:
            print(f"Error getting sample verification records: {str(e)}")
            return []
    
    def _get_sample_cleaning_tasks(self, template, parameters):
        """
        Get sample cleaning tasks for preview.
        """
        try:
            start_date = datetime.strptime(parameters.get('startDate'), '%Y-%m-%d').date()
            end_date = datetime.strptime(parameters.get('endDate'), '%Y-%m-%d').date()
            
            # Get cleaning tasks for the specified date range and department
            tasks = TaskInstance.objects.filter(
                due_date__gte=start_date,
                due_date__lte=end_date,
                department=template.department,
                cleaning_item__isnull=False
            ).select_related(
                'cleaning_item',
                'assigned_to'
            ).order_by('-due_date')[:10]  # Limit to 10 tasks for preview
            
            # Format tasks for preview
            formatted_tasks = []
            for task in tasks:
                formatted_task = {
                    'date': task.due_date.strftime('%Y-%m-%d'),
                    'name': task.cleaning_item.name,
                    'status': task.get_status_display(),
                    'assigned_to': task.assigned_to.user.username if task.assigned_to else "Unassigned",
                    
                }
                
                formatted_tasks.append(formatted_task)
            
            return formatted_tasks
        except Exception as e:
            print(f"Error getting sample cleaning tasks: {str(e)}")
            return []


def generate_document_file(template, parameters, user):
    """
    Prepare data for a document file based on the template and parameters.
    This version removes Excel generation and prepares data for future PDF output.
    Returns a tuple of (file_content_bytes, filename, error_message).
    """
    try:
        start_date_str = parameters.get('startDate')
        end_date_str = parameters.get('endDate')

        if not start_date_str or not end_date_str:
            return None, None, "Start date and end date are required parameters."

        start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        
        document_info = {
            "document_title": template.name,
            "template_type": template.template_type,
            "department": template.department.name,
            "generated_by": user.username,
            "generation_datetime_utc": datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ'),
            "date_range_str": f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
            "parameters_used": parameters, # Include for reference
            "sections": []
        }

        # Section 1: Verification Records
        if template.template_type == 'verification' and parameters.get('includeThermometerVerifications', True):
            records = ThermometerVerificationRecord.objects.filter(
                date_verified__gte=start_date,
                date_verified__lte=end_date,
                thermometer__department=template.department
            ).order_by('-date_verified').select_related('thermometer', 'calibrated_by')
            
            verification_data = []
            if records.exists():
                for record in records:
                    verification_data.append({
                        'Date Verified': record.date_verified.strftime('%Y-%m-%d'),
                        'Thermometer S/N': record.thermometer.serial_number,
                        'Calibrated Instrument No': record.calibrated_instrument_no,
                        'Reading After Verification': f"{record.reading_after_verification}°C",
                        'Calibrated By': record.calibrated_by.username if record.calibrated_by else "Unknown",
                        'Corrective Action': record.corrective_action or "None"
                    })
            document_info["sections"].append({
                "title": "Thermometer Verification Records",
                "type": "verification_records",
                "data": verification_data,
                "headers": ['Date Verified', 'Thermometer S/N', 'Calibrated Instrument No', 'Reading After Verification', 'Calibrated By', 'Corrective Action']
            })
        
        # Section 2: Temperature Logs
        if template.template_type == 'temperature' and parameters.get('includeTemperatureLogs', True):
            date_format = parameters.get('dateFormat', '%Y-%m-%d') # Keep for potential display formatting
            
            logs = TemperatureLog.objects.filter(
                log_datetime__date__gte=start_date,
                log_datetime__date__lte=end_date,
                department=template.department
            ).select_related(
                'area_unit',
                'thermometer_used',
                'logged_by'
            ).order_by('log_datetime')
            
            temperature_log_data = []
            if logs.exists():
                for log in logs:
                    temperature_log_data.append({
                        'Date': log.log_datetime.strftime(date_format), # Use specified date_format
                        'Time': log.log_datetime.strftime('%H:%M:%S'),
                        'Area/Unit': log.area_unit.name,
                        'Time Period': log.get_time_period_display(),
                        'Temperature': f"{float(log.temperature_reading):.1f}°C",
                        'Target Range': f"{log.area_unit.target_temperature_min}°C - {log.area_unit.target_temperature_max}°C" if log.area_unit.target_temperature_min is not None and log.area_unit.target_temperature_max is not None else "N/A",
                        'Status': 'Within Range' if log.is_within_target_range() else ('Out of Range' if log.is_within_target_range() is False else 'N/A'),
                        'Thermometer S/N': log.thermometer_used.serial_number,
                        'Logged By': log.logged_by.username,
                        'Corrective Action': log.corrective_action or "None"
                    })
            document_info["sections"].append({
                "title": "Temperature Logs",
                "type": "temperature_logs",
                "data": temperature_log_data,
                "headers": ['Date', 'Time', 'Area/Unit', 'Time Period', 'Temperature', 'Target Range', 'Status', 'Thermometer S/N', 'Logged By', 'Corrective Action']
            })


        # Section 3: Cleaning Tasks
        if template.template_type == 'cleaning' and parameters.get('includeCleaningTasks', True):
            tasks = TaskInstance.objects.filter(
                cleaning_item__isnull=False,
                due_date__gte=start_date,
                due_date__lte=end_date,
                department=template.department
            ).select_related('assigned_to', 'cleaning_item').order_by('due_date', 'cleaning_item__name')

            cleaning_task_data = []
            if tasks.exists():
                for task in tasks:
                    cleaning_task_data.append({
                        'Due Date': task.due_date.strftime('%Y-%m-%d'),
                        'Task Name': task.cleaning_item.name,
                        'Status': task.get_status_display(),
                        'Assigned To': task.assigned_to.user.username if task.assigned_to else 'Unassigned',
                        'Notes': task.notes or ''
                    })
            document_info["sections"].append({
                "title": "Cleaning Task Records",
                "type": "cleaning_tasks",
                "data": cleaning_task_data,
                "headers": ['Due Date', 'Task Name', 'Status', 'Assigned To', 'Notes']
            })

        # --- PDF Generation using ReportLab ---
        buffer = io.BytesIO()
        # Adjust margins for header/footer
        doc = SimpleDocTemplate(buffer, pagesize=letter,
                                rightMargin=0.75*inch, leftMargin=0.75*inch,
                                topMargin=1.25*inch, bottomMargin=1.0*inch) # Increased top/bottom margins
        styles = getSampleStyleSheet()
        # Define Colors
        HEADER_BLUE = colors.HexColor('#4F81BD')
        STATUS_GREEN = colors.HexColor('#00B050') # A distinct green
        STATUS_RED = colors.red # Existing red
        TEXT_WHITE = colors.whitesmoke
        TEXT_BLACK = colors.black

        # Custom Paragraph Styles
        styles.add(ParagraphStyle(name='MainTitle', parent=styles['h1'], textColor=HEADER_BLUE, alignment=TA_CENTER, fontSize=20, leading=24))
        styles.add(ParagraphStyle(name='Subtitle', parent=styles['Normal'], alignment=TA_CENTER, fontSize=12, leading=14, spaceBefore=6))
        styles.add(ParagraphStyle(name='SectionTitle', parent=styles['h2'], textColor=HEADER_BLUE, alignment=TA_CENTER, fontSize=14, leading=18, spaceBefore=12, spaceAfter=6))
        styles.add(ParagraphStyle(name='RedText', parent=styles['Normal'], textColor=STATUS_RED))
        styles.add(ParagraphStyle(name='GreenText', parent=styles['Normal'], textColor=STATUS_GREEN))
        styles.add(ParagraphStyle(name='NormalCentered', parent=styles['Normal'], alignment=TA_CENTER))
        styles.add(ParagraphStyle(name='FooterText', parent=styles['Normal'], alignment=TA_CENTER, fontSize=8))
        styles.add(ParagraphStyle(name='NormalSmall', parent=styles['Normal'], fontSize=8, textColor=colors.darkgrey))
        styles.add(ParagraphStyle(name='CardHeader', parent=styles['Normal'], fontSize=10, fontName='Helvetica-Bold'))
        styles.add(ParagraphStyle(name='TemperatureText', parent=styles['Normal'], fontSize=10, textColor=HEADER_BLUE))
        story = []

        # Main Title and Subtitle (Date Range)
        story.append(Paragraph(document_info.get('document_title', 'Document'), styles['MainTitle']))
        story.append(Paragraph(f"Date Range: {document_info.get('date_range_str', 'N/A')}", styles['Subtitle']))
        story.append(Spacer(1, 0.3*inch))

        generation_datetime_obj = datetime.strptime(document_info.get('generation_datetime_utc'), '%Y-%m-%dT%H:%M:%SZ')
        generation_date_str_for_header = generation_datetime_obj.strftime('%Y-%m-%d')
        doc_title_for_header = document_info.get('document_title', 'Document')

        def draw_later_pages_header(canvas, doc):
            canvas.saveState()
            canvas.setFont('Helvetica', 9)
            header_y_pos = doc.height + doc.topMargin - 0.5*inch
            
            # Document Title (left)
            canvas.drawString(doc.leftMargin, header_y_pos, doc_title_for_header)
            
            # Generation Date (right)
            canvas.drawRightString(doc.width + doc.leftMargin, header_y_pos, f"Date: {generation_date_str_for_header}")
            
            line_y = header_y_pos - 0.1*inch
            canvas.line(doc.leftMargin, line_y, doc.width + doc.leftMargin, line_y)
            canvas.restoreState()

        def draw_page_footer(canvas, doc):
            canvas.saveState()
            page_num_text = f"Page {doc.page}"
            # Using the new FooterText style for consistency, though direct canvas drawing doesn't use ParagraphStyle
            canvas.setFont('Helvetica', 8) 
            canvas.drawCentredString(doc.width/2 + doc.leftMargin, 0.5*inch, page_num_text)
            canvas.restoreState()

        # Frame and PageTemplate setup for different first/later pages
        frame_full = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id='full_frame')
        
        # First page: only footer, header is part of story
        first_page_template = PageTemplate(id='FirstPage',
                                           frames=[frame_full],
                                           onPage=lambda canvas, dc: draw_page_footer(canvas, dc))
        # Later pages: header and footer
        later_pages_template = PageTemplate(id='LaterPages',
                                            frames=[frame_full],
                                            onPage=lambda canvas, dc: (draw_later_pages_header(canvas, dc), draw_page_footer(canvas, dc)))
        
        doc.addPageTemplates([first_page_template, later_pages_template])
        
        # Explicitly switch to the 'LaterPages' template for the main content sections
        story.append(NextPageTemplate('LaterPages'))

        # Sections - Basic Info
        for section in document_info.get('sections', []):
            story.append(Paragraph(section.get('title', 'Section'), styles['SectionTitle']))
            section_data = section.get('data', [])
            section_headers = section.get('headers', [])

            if not section_data:
                story.append(Paragraph('No data available for this section.', styles['Normal']))
            else:
                # Create card-style layout for each data item
                # First, add a small header showing what fields are included
                field_info = Paragraph(f"Showing data for: {', '.join(section_headers)}", styles['NormalSmall'])
                story.append(field_info)
                story.append(Spacer(1, 0.1*inch))
                
                # For each data item, create a card
                for item_dict in section_data:
                    # Determine card background color based on status for temperature logs
                    card_bg_color = colors.white
                    if section.get('type') == 'temperature_logs':
                        status = item_dict.get('Status', '')
                        if status == 'Out of Range':
                            card_bg_color = colors.mistyrose  # Light red background
                        elif status == 'Within Range':
                            card_bg_color = colors.honeydew  # Light green background
                    
                    # Create a list of key-value pairs for the card content
                    card_content = []
                    
                    # First row contains Date, Time, Area/Unit as a header
                    header_items = []
                    if 'Date' in item_dict:
                        header_items.append(f"Date: {item_dict['Date']}")
                    if 'Time' in item_dict:
                        header_items.append(f"Time: {item_dict['Time']}")
                    if 'Area/Unit' in item_dict:
                        header_items.append(f"Location: {item_dict['Area/Unit']}")
                    elif 'Thermometer S/N' in item_dict and section.get('type') == 'verification_records':
                        header_items.append(f"Thermometer: {item_dict['Thermometer S/N']}")
                    elif 'Task Name' in item_dict and section.get('type') == 'cleaning_tasks':
                        header_items.append(f"Task: {item_dict['Task Name']}")
                        
                    # Join header items with separator
                    header_text = " | ".join(header_items)
                    card_content.append([Paragraph(header_text, styles['CardHeader'])])
                    
                    # Create two-column layout for remaining data
                    data_rows = []
                    row = []
                    col_count = 0
                    
                    # Skip items already in header
                    skip_keys = ['Date', 'Time', 'Area/Unit']
                    if section.get('type') == 'verification_records':
                        skip_keys.append('Thermometer S/N')
                    elif section.get('type') == 'cleaning_tasks':
                        skip_keys.append('Task Name')
                        
                    # Add remaining fields in two columns
                    for header in section_headers:
                        if header in skip_keys:
                            continue
                            
                        value = item_dict.get(header, '')
                        label = f"{header}: "
                        
                        # Format the value based on field type
                        if header == 'Status':
                            if value == 'Out of Range':
                                value_text = Paragraph(f"<b>{label}</b>" + str(value), styles['RedText'])
                            elif value == 'Within Range':
                                value_text = Paragraph(f"<b>{label}</b>" + str(value), styles['GreenText'])
                            else:
                                value_text = Paragraph(f"<b>{label}</b>" + str(value), styles['Normal'])
                        elif header == 'Temperature' or header == 'Target Range' or header == 'Reading After Verification':
                            # Highlight temperature values
                            value_text = Paragraph(f"<b>{label}</b>" + str(value), styles['TemperatureText'])
                        else:
                            value_text = Paragraph(f"<b>{label}</b>" + str(value), styles['Normal'])
                            
                        row.append(value_text)
                        col_count += 1
                        
                        # Create a new row after every 2 columns
                        if col_count == 2:
                            data_rows.append(row)
                            row = []
                            col_count = 0
                    
                    # Add any remaining columns
                    if col_count > 0:
                        # If we have an odd number of columns, add an empty cell
                        while col_count < 2:
                            row.append("")
                            col_count += 1
                        data_rows.append(row)
                    
                    # Add data rows to card content
                    for data_row in data_rows:
                        card_content.append(data_row)
                    
                    # Create the card table
                    card = Table(card_content, colWidths=[doc.width/2, doc.width/2])
                    card.setStyle(TableStyle([
                        # Header row styling
                        ('BACKGROUND', (0,0), (-1,0), HEADER_BLUE),
                        ('TEXTCOLOR', (0,0), (-1,0), TEXT_WHITE),
                        ('SPAN', (0,0), (-1,0)),  # Span the header across all columns
                        ('ALIGN', (0,0), (-1,0), 'CENTER'),
                        
                        # Card body styling
                        ('BACKGROUND', (0,1), (-1,-1), card_bg_color),
                        ('ALIGN', (0,1), (-1,-1), 'LEFT'),
                        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                        ('GRID', (0,0), (-1,-1), 1, colors.lightgrey),
                        ('BOX', (0,0), (-1,-1), 1, colors.darkgrey),
                        ('TOPPADDING', (0,0), (-1,-1), 6),
                        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                        ('LEFTPADDING', (0,0), (-1,-1), 10),
                        ('RIGHTPADDING', (0,0), (-1,-1), 10),
                    ]))
                    
                    story.append(card)
                    story.append(Spacer(1, 0.2*inch))
            story.append(Spacer(1, 0.2*inch))

        # Add manager sign-off section at the bottom
        story.append(PageBreak())
        story.append(Paragraph("Verification", styles['SectionTitle']))
        story.append(Spacer(1, 0.3*inch))
        
        # Add manager sign-off section
        current_date = datetime.now().strftime('%Y-%m-%d')
        current_time = datetime.now().strftime('%H:%M')
        
        # Create a full-width line for signature
        signature_line = Table([[""]],  colWidths=[doc.width-1*inch])
        signature_line.setStyle(TableStyle([
            ('LINEBELOW', (0,0), (0,0), 1, colors.black),  # Line for signature
            ('TOPPADDING', (0,0), (0,0), 36),  # Space for signature
            ('BOTTOMPADDING', (0,0), (0,0), 6),
        ]))
        story.append(signature_line)
        
        # Add user info and date with full name
        # Get user's full name if available, otherwise fallback to username
        user_full_name = f"{user.first_name} {user.last_name}".strip() if (user and user.first_name) else document_info.get('generated_by', 'N/A')
        
        user_info_data = [
            [f"{user_full_name}", ""],
            [f"Date: {current_date}", f"Date: _________________"],
        ]
        
        user_info_table = Table(user_info_data, colWidths=[doc.width/2-0.25*inch, doc.width/2-0.25*inch])
        user_info_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(user_info_table)
        story.append(Spacer(1, 0.5*inch))
        
        # Add manager sign-off section
        story.append(Paragraph("Manager Sign-off:", styles['Normal']))
        story.append(Spacer(1, 0.1*inch))
        
        manager_sign_data = [
            ["Name: _______________________________", "Signature: _______________________________"],
            [f"Date: {current_date}", f"Time: {current_time}"],
        ]
        
        manager_sign_table = Table(manager_sign_data, colWidths=[doc.width/2-0.25*inch, doc.width/2-0.25*inch])
        manager_sign_table.setStyle(TableStyle([
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(manager_sign_table)
        
        # Add company footer
        story.append(Spacer(1, 0.5*inch))
        company_footer = Paragraph("CleanTrac Temperature Management System - Confidential Document", styles['FooterText'])
        story.append(company_footer)

        doc.build(story) # Removed onFirstPage/onLaterPages, using PageTemplates now
        file_content_bytes = buffer.getvalue()
        buffer.close()
        
        # Construct filename with .pdf extension
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{template.name.replace(' ', '_')}_{timestamp}.pdf"
        
        return file_content_bytes, filename, None

    except Exception as e:
        # Log the detailed exception for server-side review
        print(f"Critical error in generate_document_file for template {template.id if template else 'Unknown'} by user {user.username if user else 'Unknown'}:")
        traceback.print_exc()
        # Return a more generic error message to the caller (ViewSet)
        error_message = "Failed to generate PDF content due to an internal error. The issue has been logged."
        return None, None, error_message


class GeneratedDocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing generated documents.
    Only managers can create documents in their department.
    """
    serializer_class = GeneratedDocumentSerializer
    permission_classes = [IsManagerForWriteOrAuthenticatedReadOnly]
    
    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return GeneratedDocument.objects.none()
            
        # Filter by status if provided
        status_filter = self.request.query_params.get('status', None)
        queryset = GeneratedDocument.objects.all()
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        # Superusers can see all generated documents
        if user.is_superuser:
            return queryset
        
        # Managers and staff can only see documents for their department
        try:
            if user.profile.department:
                return queryset.filter(department=user.profile.department)
            else:
                return GeneratedDocument.objects.none()
        except:
            return GeneratedDocument.objects.none()
    
    def create(self, request, *args, **kwargs):
        # Extract data from request
        template_id = request.data.get('template_id')
        department_id = request.data.get('department_id')
        parameters = request.data.get('parameters', {})
        
        # Validate required fields
        if not template_id or not department_id or not parameters:
            return Response(
                {"detail": "Missing required fields: template_id, department_id, or parameters"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Get the template
            template = DocumentTemplate.objects.get(id=template_id)
            
            # Generate the document file
            file_content, filename, error_message = generate_document_file(template, parameters, request.user)
            
            if error_message:
                # Create a failed document record
                document = GeneratedDocument.objects.create(
                    template=template,
                    department_id=department_id,
                    generated_by=request.user,
                    status='failed',
                    error_message=error_message,
                    parameters=parameters
                )
                
                return Response(
                    {"detail": error_message, "document_id": document.id},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create the document file
            document = GeneratedDocument(
                template=template,
                department_id=department_id,
                generated_by=request.user,
                status='completed',
                parameters=parameters
            )
            
            # Save the generated file
            document.generated_file.save(filename, ContentFile(file_content))
            document.save()
            
            # Prepare and return the PDF response
            response = HttpResponse(file_content, content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
            
        except DocumentTemplate.DoesNotExist:
            return Response(
                {"detail": "Template not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": f"Error generating document: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def perform_create(self, serializer):
        # Set generated_by to the requesting user
        serializer.save(generated_by=self.request.user)
        
    @action(detail=False, methods=['get'], url_path='recent')
    def recent_documents(self, request):
        """
        Returns the most recent generated documents for the user's department.
        """
        documents = self.get_queryset().order_by('-created_at')[:10]
        serializer = self.get_serializer(documents, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'], url_path='by-template/(?P<template_id>[^/.]+)')
    def by_template(self, request, template_id=None):
        """
        Returns documents generated from a specific template.
        """
        documents = self.get_queryset().filter(template_id=template_id)
        serializer = self.get_serializer(documents, many=True)
        return Response(serializer.data)
