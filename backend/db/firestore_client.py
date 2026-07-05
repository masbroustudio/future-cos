import os
import firebase_admin
from firebase_admin import credentials, firestore

_firestore_client = None

def get_firestore_client():
    """
    Get or initialize the Firestore client.
    Supports Firestore Emulator via FIRESTORE_EMULATOR_HOST env var.
    """
    global _firestore_client
    if _firestore_client is not None:
        return _firestore_client

    # Check if emulator is set (always use emulator in development)
    emulator_host = os.getenv("FIRESTORE_EMULATOR_HOST")
    if emulator_host:
        os.environ["FIRESTORE_EMULATOR_HOST"] = emulator_host
        print(f"Firestore Client: Connecting to Firestore Emulator at {emulator_host}")

    # Check if firebase is already initialized
    try:
        app = firebase_admin.get_app()
    except ValueError:
        # Initialize Firebase Admin SDK
        cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
        project_id = os.getenv("FIRESTORE_PROJECT_ID")

        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred, {
                'projectId': project_id
            })
            print(f"Firestore Client: Initialized with service account credentials from {cred_path}")
        else:
            # Fallback to default credentials or empty config for emulator
            if emulator_host:
                # Dummy credentials for emulator
                firebase_admin.initialize_app(options={'projectId': project_id or 'future-cos-dev'})
                print("Firestore Client: Initialized empty Firebase app for Emulator")
            else:
                # Standard Google Application Default Credentials
                firebase_admin.initialize_app()
                print("Firestore Client: Initialized Firebase app using Application Default Credentials")

    _firestore_client = firestore.client()
    return _firestore_client
