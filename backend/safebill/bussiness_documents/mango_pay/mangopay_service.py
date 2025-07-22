import requests
from django.conf import settings


def create_mangopay_user(user):
    print("Creating User....")
    url = "https://api.sandbox.mangopay.com/v2.01/{client_id}/users/natural".format(
        client_id=settings.MANGOPAY_CLIENT_ID
    )
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Basic {settings.MANGOPAY_API_KEY}"
    }
    data = {
        "FirstName": user.first_name,
        "LastName": user.last_name,
        "Birthday": 1300186358,  # Unix timestamp
        "Nationality": "FR",
        "CountryOfResidence": "FR",
        "Email": user.email
    }
    response = requests.post(url, json=data, headers=headers)
    return response.json()


def create_kyc_document(mangopay_user_id, doc_type):
    url = f"https://api.sandbox.mangopay.com/v2.01/{settings.MANGOPAY_CLIENT_ID}/users/{mangopay_user_id}/KYC/documents"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Basic {settings.MANGOPAY_API_KEY}"
    }
    data = {
        "Type": doc_type  # e.g., "IDENTITY_PROOF"
    }
    response = requests.post(url, json=data, headers=headers)
    return response.json()


def upload_kyc_page(mangopay_user_id, kyc_document_id, file_path):
    url = f"https://api.sandbox.mangopay.com/v2.01/{settings.MANGOPAY_CLIENT_ID}/users/{mangopay_user_id}/KYC/documents/{kyc_document_id}/pages"
    headers = {
        "Authorization": f"Basic {settings.MANGOPAY_API_KEY}"
    }
    with open(file_path, 'rb') as f:
        files = {'file': f}
        response = requests.post(url, files=files, headers=headers)
    return response.json()