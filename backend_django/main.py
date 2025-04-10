import os
import sys
import io
import json
from django.http import JsonResponse
from django.conf import settings
from django.core.wsgi import get_wsgi_application
from django.urls import path
from django.core.management import execute_from_command_line
from django.views.decorators.csrf import csrf_exempt
import re
from dateparser import parse

from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams
from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.pdfpage import PDFPage
from pdfminer.pdfparser import PDFParser

settings.configure(
    DEBUG=False,
    ROOT_URLCONF=__name__,
    SECRET_KEY='1_d0nt_kn0w_what_t0_keep',
    ALLOWED_HOSTS=['*'],
)

def extract_text_from_pdf(pdf_path):
    output_string = io.StringIO()
    with open(pdf_path, 'rb') as in_file:
        parser = PDFParser(in_file)
        doc = PDFDocument(parser)
        rsrcmgr = PDFResourceManager()
        device = TextConverter(rsrcmgr, output_string, laparams=LAParams())
        interpreter = PDFPageInterpreter(rsrcmgr, device)
        
        for page in PDFPage.create_pages(doc):
            interpreter.process_page(page)
    
    return output_string.getvalue()

def extract_dates(text):
    date_patterns = [
        r"\b\d{1,2} [A-Za-z]+ \d{4}\b",  # Example: "16 June 2025"
        r"\b[A-Za-z]+ \d{1,2},? \d{4}\b", # Example: "June 16, 2025"
        r"\b\d{1,2}/\d{1,2}/\d{4}\b",    # Example: "16/06/2025"
        r"\b\d{4}-\d{2}-\d{2}\b"         # Example: "2025-10-06"
    ]
    
    found_dates = []
    
    for pattern in date_patterns:
        matches = re.findall(pattern, text)
        for match in matches:
            parsed_date = parse(match)
            if parsed_date:
                found_dates.append(parsed_date.strftime("%Y-%m-%d"))
    
    return found_dates


@csrf_exempt
def upload_pdf(request):

    print("Request method:", request.method)
    print("Request headers:", request.headers)
    print("Files in request:", request.FILES)
    print("File keys:", list(request.FILES.keys()) if request.FILES else "No files")
    
    if request.method == "POST" and request.FILES.get("pdf"):
        pdf_file = request.FILES["pdf"]
        pdf_path = f"/tmp/{pdf_file.name}"

        response_data = {
            "message": "",
            "date": "",
        }
        
        try:
            with open(pdf_path, "wb") as f:
                for chunk in pdf_file.chunks():
                    f.write(chunk)
            
            extracted_text = extract_text_from_pdf(pdf_path)
            date = extract_dates(extracted_text)
            
            response_data["message"] = "PDF processed successfully"
            response_data["date"] = date
            
        except Exception as e: 
            response_data["message"] = f"Error processing PDF: {str(e)}"
        
        finally:
            try:
                os.remove(pdf_path)
            except:
                pass
        
        return JsonResponse(response_data)
    
    return JsonResponse({
        "message": "Please upload a PDF file via POST request",
        "document_type": "",
        "extracted_text": ""
    })

# URL patterns
urlpatterns = [
    path("upload/", upload_pdf),
    path("upload", upload_pdf),
    path("", upload_pdf),
]

application = get_wsgi_application()

app = application

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "__main__")
    execute_from_command_line(sys.argv)