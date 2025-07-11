from rest_framework import serializers
from .models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import BusinessDetail


class BusinessDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessDetail
        fields = [
            'company_name', 'siret_number', 'full_address',
            'type_of_activity', 'service_area', 'siret_verified'
        ]
        read_only_fields = ['siret_verified']


class RegistrationSerializer(serializers.Serializer):
    Basic_Information = serializers.DictField()
    Bussiness_information = serializers.DictField()

    def validate(self, data):
        # You can add more validation here if needed
        return data

    def create(self, validated_data):
        basic_info = validated_data['Basic_Information']
        business_info = validated_data['Bussiness_information']
        # Create user
        if User.objects.filter(email=basic_info['email']).exists():
            raise serializers.ValidationError({
                'email': 'This email is already taken.'
            })
        if User.objects.filter(username=basic_info['username']).exists():
            raise serializers.ValidationError({
                'username': 'This username is already taken.'
            })
        if BusinessDetail.objects.filter(siret_number=business_info['siret_number']).exists():
            raise serializers.ValidationError({
                'siret_number': 'This SIRET number is already taken.'
            })
        user = User.objects.create_user(
            username=basic_info['username'],
            email=basic_info['email'],
            password=basic_info['password'],
            first_name=basic_info.get('first_name', ''),
            last_name=basic_info.get('last_name', ''),
            phone_number=basic_info.get('phone_number', ''),
            role=basic_info['role'],
            is_active=False
        )
        # Create business detail
        BusinessDetail.objects.create(
            user=user,
            company_name=business_info['company_name'],
            siret_number=business_info['siret_number'],
            full_address=business_info['full_address'],
            type_of_activity=business_info['type_of_activity'],
            service_area=business_info['service_area'],
            siret_verified=False
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