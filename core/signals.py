from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import UserProfile

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    """
    Signal handler to create or update a UserProfile when a User is saved.
    - If a new user is created, this signal now defers profile creation
      to other mechanisms (like admin inlines or explicit programmatic creation).
    - If an existing user is updated, it ensures a profile exists.
    """
    if created:
        # When a user is created, we 'pass'.
        # This allows admin inlines or other explicit processes to handle profile creation
        # without conflict from this signal.
        # If a user is created programmatically without a profile,
        # the 'else' block below will create it on the user's first save/update.
        pass
    else:
        # For existing users being updated, or for users who were created
        # without a profile (due to the 'if created: pass' logic),
        # ensure a UserProfile exists.
        profile, profile_was_just_created = UserProfile.objects.get_or_create(user=instance)
        
        # Optional: If the profile was just created for an existing user,
        # you might want to log this or perform initial setup.
        # if profile_was_just_created:
        #     print(f"UserProfile created on update for user {instance.username}")

        # Optional: If you need to sync fields from User to UserProfile on update
        # (e.g., if UserProfile stores a copy of the user's email and it might change)
        # if hasattr(profile, 'email') and profile.email != instance.email:
        #     profile.email = instance.email # Example
        #     profile.save()
        pass # Main goal here is just ensuring existence via get_or_create
