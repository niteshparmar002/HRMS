from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        error_data = {
            'success': False,
            'message': 'An error occurred.',
            'errors': response.data,
        }

        if response.status_code == status.HTTP_400_BAD_REQUEST:
            error_data['message'] = 'Validation failed. Please check your input.'
        elif response.status_code == status.HTTP_404_NOT_FOUND:
            error_data['message'] = 'The requested resource was not found.'
        elif response.status_code == status.HTTP_405_METHOD_NOT_ALLOWED:
            error_data['message'] = 'Method not allowed.'
        elif response.status_code == status.HTTP_500_INTERNAL_SERVER_ERROR:
            error_data['message'] = 'Internal server error.'

        response.data = error_data

    return response
