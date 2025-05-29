from rest_framework import serializers
from .models import DocumentTemplate, GeneratedDocument, Department
from django.contrib.auth.models import User

class DocumentTemplateSerializer(serializers.ModelSerializer):
    """Serializer for the DocumentTemplate model."""
    
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True
    )
    department_name = serializers.CharField(source='department.name', read_only=True)
    created_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='created_by',
        write_only=True,
        required=False
    )
    created_by_username = serializers.CharField(source='created_by.username', read_only=True, allow_null=True)
    template_type_display = serializers.CharField(source='get_template_type_display', read_only=True)
    
    class Meta:
        model = DocumentTemplate
        fields = [
            'id', 'name', 'description', 'department_id', 'department_name',
            'template_file', 'template_type', 'template_type_display',
            'created_by_id', 'created_by_username', 'created_at', 'updated_at'
        ]
    
    def create(self, validated_data):
        # If created_by is not provided, use the requesting user
        if 'created_by' not in validated_data and 'request' in self.context:
            validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class GeneratedDocumentSerializer(serializers.ModelSerializer):
    """Serializer for the GeneratedDocument model."""
    
    template_id = serializers.PrimaryKeyRelatedField(
        queryset=DocumentTemplate.objects.all(),
        source='template',
        write_only=True
    )
    template_name = serializers.CharField(source='template.name', read_only=True)
    department_id = serializers.PrimaryKeyRelatedField(
        queryset=Department.objects.all(),
        source='department',
        write_only=True
    )
    department_name = serializers.CharField(source='department.name', read_only=True)
    generated_by_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source='generated_by',
        write_only=True,
        required=False
    )
    generated_by_username = serializers.CharField(source='generated_by.username', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = GeneratedDocument
        fields = [
            'id', 'template_id', 'template_name', 'generated_file',
            'generated_by_id', 'generated_by_username', 'department_id', 'department_name',
            'status', 'status_display', 'error_message', 'parameters', 'created_at'
        ]
    
    def create(self, validated_data):
        # If generated_by is not provided, use the requesting user
        if 'generated_by' not in validated_data and 'request' in self.context:
            validated_data['generated_by'] = self.context['request'].user
            
        # If department is not provided, use the template's department
        if 'department' not in validated_data and 'template' in validated_data:
            validated_data['department'] = validated_data['template'].department
            
        return super().create(validated_data)
