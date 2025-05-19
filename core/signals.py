from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """
    Signal handler to create or update a UserProfile when a User is saved.
    """
    if created:
        UserProfile.objects.create(user=instance)
    else:
        # If you want to update the profile when the user is updated (e.g., email change)
        # you might need to access it via instance.profile and save it.
        # However, usually UserProfile fields are managed separately.
        # For now, we'll just ensure it exists if for some reason it wasn't created.
        try:
            instance.profile.save() # This will create if it doesn't exist, or update if it does.
        except UserProfile.DoesNotExist:
            UserProfile.objects.create(user=instance) # Ensure profile exists
