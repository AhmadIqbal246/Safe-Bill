from rest_framework import serializers
from .models import User, BuyerModel
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import BusinessDetail
from .models import BankAccount
import json


class BusinessDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessDetail
        fields = [
            'company_name', 'siret_number', 'full_address',
            'type_of_activity', 'selected_categories',
            'selected_subcategories',
            'selected_service_areas',
            'siret_verified', 'company_contact_person_first_name',
           'company_contact_person_last_name',
        ]
        read_only_fields = ['siret_verified']


class SellerRegistrationSerializer(serializers.Serializer):
    Basic_Information = serializers.DictField()
    Bussiness_information = serializers.DictField()

    def validate(self, data):
        basic_info = data.get('Basic_Information', {})
        business_info = data.get('Bussiness_information', {})

        # Validate role
        role = basic_info.get('role', 'seller')
        if role not in ['seller', 'professional-buyer']:
            raise serializers.ValidationError({
                'role': ('Invalid role. Must be either "seller" or '
                        '"professional-buyer".')
            })

        # Email
        if 'email' in basic_info and User.objects.filter(
            email=basic_info['email']
        ).exists():
            raise serializers.ValidationError(
                {'email': 'This email is already taken.'}
            )
        # Username
        if 'username' in basic_info and User.objects.filter(
            username=basic_info['username']
        ).exists():
            raise serializers.ValidationError(
                {'username': 'This username is already taken.'}
            )

        # SIRET number
        if 'siret_number' in business_info and BusinessDetail.objects.filter(
            siret_number=business_info['siret_number']
        ).exists():
            raise serializers.ValidationError(
                {'siret_number': 'This SIRET number is already taken.'}
            )

        return data

    def create(self, validated_data):
        basic_info = validated_data['Basic_Information']
        business_info = validated_data['Bussiness_information']
        
        # Get role from basic_info, default to 'seller'
        role = basic_info.get('role', 'seller')
        
        # Create user
        user = User.objects.create_user(
            username=basic_info['username'],
            email=basic_info['email'],
            password=basic_info['password'],
            phone_number=basic_info.get('phone_number', ''),
            role=role,  # Use the role from the request
            is_active=False
        )
        
        # Create business detail
        BusinessDetail.objects.create(
            user=user,
            company_name=business_info['company_name'],
            siret_number=business_info['siret_number'],
            full_address=business_info['full_address'],
            type_of_activity=business_info['type_of_activity'],
            #department_numbers=business_info.get('department_numbers', ''),
            selected_categories=business_info.get('selected_categories', []),
            selected_subcategories=business_info.get('selected_subcategories', []),
            selected_service_areas=business_info.get('selected_service_areas', []),
            siret_verified=True,
            company_contact_person_first_name=business_info.get(
                'company_contact_person_first_name', ''),
            company_contact_person_last_name=business_info.get(
                'company_contact_person_last_name', ''),
        )
        return user
    


class BuyerRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField()
    first_name = serializers.CharField(required=True)
    last_name = serializers.CharField(required=True)
    address = serializers.CharField(required=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'first_name', 'last_name', 'address'
        ]

    def validate_email(self, value):
        """
        Check that the email is not already taken.
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('This email is already taken.')
        return value

    def create(self, validated_data):
        # Remove buyer-specific fields from validated_data for User creation
        first_name = validated_data.pop('first_name')
        last_name = validated_data.pop('last_name')
        address = validated_data.pop('address')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role='buyer',
            is_active=False
        )
        BuyerModel.objects.create(
            user=user,
            first_name=first_name,
            last_name=last_name,
            address=address
        )
        return user



class UserTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        # Retrieve the token using the parent class method
        token = super().get_token(user)
        # Add additional user information to the token
        token['username'] = user.username
        token['email'] = user.email
        token['role'] = user.role
        token['onboarding_complete'] = user.onboarding_complete
        token['is_email_verified'] = user.is_email_verified
        token['phone_number'] = user.phone_number
        token['is_admin'] = user.is_admin
        return token
    

class EmailVerificationSerializer(serializers.Serializer):
    token = serializers.CharField() 


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(
        write_only=True, validators=[validate_password]
    ) 


class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = [
            'account_holder_name', 'iban', 'bank_code', 'branch_code',
            'rib_key', 'bic_swift', 'bank_name', 'bank_address', 'created_at'
        ]
        read_only_fields = ['created_at'] 

    def validate(self, data):
        instance = getattr(self, 'instance', None)
        iban = data.get('iban')
        rib_key = data.get('rib_key')
        bic_swift = data.get('bic_swift')

        if iban and BankAccount.objects.exclude(
            pk=getattr(instance, 'pk', None)
        ).filter(iban=iban).exists():
            raise serializers.ValidationError({
                'iban': 'This IBAN is already in use.'
            })
        if rib_key and BankAccount.objects.exclude(
            pk=getattr(instance, 'pk', None)
        ).filter(rib_key=rib_key).exists():
            raise serializers.ValidationError({
                'rib_key': 'This RIB key is already in use.'
            })
        if bic_swift and BankAccount.objects.exclude(
            pk=getattr(instance, 'pk', None)
        ).filter(bic_swift=bic_swift).exists():
            raise serializers.ValidationError({
                'bic_swift': 'This BIC/SWIFT is already in use.'
            })
        return data 


class UserProfileSerializer(serializers.ModelSerializer):
    type_of_activity = serializers.SerializerMethodField()
    selected_categories = serializers.SerializerMethodField()
    selected_subcategories = serializers.SerializerMethodField()
    selected_service_areas = serializers.SerializerMethodField()
    #department_numbers = serializers.SerializerMethodField()
    profile_pic = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'phone_number',
            'type_of_activity', 'selected_categories', 'selected_subcategories',
             'selected_service_areas',
            'about', 'profile_pic'
        ]
        read_only_fields = ['email']  # Only email is read-only now

    def get_type_of_activity(self, obj):
        try:
            return obj.business_detail.type_of_activity
        except BusinessDetail.DoesNotExist:
            return None

    def get_selected_categories(self, obj):
        try:
            return obj.business_detail.selected_categories
        except BusinessDetail.DoesNotExist:
            return []

    def get_selected_subcategories(self, obj):
        try:
            return obj.business_detail.selected_subcategories
        except BusinessDetail.DoesNotExist:
            return []

    def get_service_area(self, obj):
        try:
            return obj.business_detail.service_area
        except BusinessDetail.DoesNotExist:
            return None

    def get_selected_service_areas(self, obj):
        try:
            return obj.business_detail.selected_service_areas
        except BusinessDetail.DoesNotExist:
            return []

    def update(self, instance, validated_data):
        # Allow username update with uniqueness check
        new_username = validated_data.get('username', instance.username)
        if new_username != instance.username:
            if User.objects.filter(username=new_username).exclude(
                pk=instance.pk
            ).exists():
                raise serializers.ValidationError({
                    'username': 'This username is already taken.'
                })
            instance.username = new_username

        instance.phone_number = validated_data.get(
            'phone_number', instance.phone_number
        )
        instance.about = validated_data.get('about', instance.about)
        profile_pic = validated_data.get('profile_pic', None)
        if profile_pic is not None:
            instance.profile_pic = profile_pic
        instance.save()

        # Update or create BusinessDetail
        business_data = {}
        
        # Map frontend field names to backend field names
        field_mapping = {
            'type_of_activity': 'type_of_activity',
            'selected_categories': 'selected_categories',
            'selected_subcategories': 'selected_subcategories',
            'selected_service_areas': 'selected_service_areas',
        }
        
        for frontend_field, backend_field in field_mapping.items():
            value = self.initial_data.get(frontend_field)
            if value is not None:
                # Handle JSON strings for array fields when using FormData
                if frontend_field in ['selected_categories', 'selected_subcategories', 'selected_service_areas']:
                    if isinstance(value, str):
                        try:
                            import json
                            value = json.loads(value)
                        except (json.JSONDecodeError, TypeError):
                            # If it's not valid JSON, treat as empty array
                            value = []
                business_data[backend_field] = value

        if business_data:
            business_detail, created = BusinessDetail.objects.get_or_create(
                user=instance
            )
            for field, value in business_data.items():
                setattr(business_detail, field, value)
            business_detail.save()
        return instance