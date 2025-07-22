from rest_framework import serializers
from .models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import BusinessDetail
from .models import BankAccount
import requests
from django.conf import settings


def verify_siret_number(siret_number):
    print("Sending Verification REQ:", siret_number)
    url = (
        f'https://api.insee.fr/entreprises/sirene/V3.11/siret/{siret_number}'
    )
    headers = {
        'Accept': 'application/json',
        'Authorization': f'Bearer {settings.SIRET_VALIDATION_ACCESS_TOKEN}',
    }
    response = requests.get(url, headers=headers)
    print("Response for Verification[status-code]:", response.status_code)
    print("Response for Verification:", response.text)
    return response.status_code == 200


class BusinessDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessDetail
        fields = [
            'company_name', 'siret_number', 'full_address',
            'type_of_activity', 'service_area', 'siret_verified',
            'company_contact_person', 'skills'
        ]
        read_only_fields = ['siret_verified']


class RegistrationSerializer(serializers.Serializer):
    Basic_Information = serializers.DictField()
    Bussiness_information = serializers.DictField()

    def validate(self, data):
        basic_info = data.get('Basic_Information', {})
        business_info = data.get('Bussiness_information', {})

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
        #if 'siret_number' in business_info and BusinessDetail.objects.filter(
         #   siret_number=business_info['siret_number']
        #).exists():
          #  raise serializers.ValidationError(
         #       {'siret_number': 'This SIRET number is already taken.'}
        #    )

        # SIRET number validation via INSEE API
        #siret_number = business_info.get('siret_number')
        #if siret_number:
        #    if not verify_siret_number(siret_number):
          #      raise serializers.ValidationError(
         #           {'siret_number': 'Invalid SIRET number.'}
        #        )

        return data

    def create(self, validated_data):
        basic_info = validated_data['Basic_Information']
        business_info = validated_data['Bussiness_information']
        # Create user
        user = User.objects.create_user(
            username=basic_info['username'],
            email=basic_info['email'],
            password=basic_info['password'],
            phone_number=basic_info.get('phone_number', ''),
            role=basic_info['role'],
            is_active=False
        )
        # Create business detail
        siret_number = business_info['siret_number']
        #siret_verified = verify_siret_number(siret_number)
        BusinessDetail.objects.create(
            user=user,
            company_name=business_info['company_name'],
            siret_number=siret_number,
            full_address=business_info['full_address'],
            type_of_activity=business_info['type_of_activity'],
            service_area=business_info['service_area'],
            siret_verified=False,
            company_contact_person=business_info.get(
                'company_contact_person', ''),
            skills=business_info.get('skills', []),
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