import os
import sys
import io
from django.http import HttpResponse
from django.conf import settings
from django.core.wsgi import get_wsgi_application
from django.urls import path
from django.core.management import execute_from_command_line

# Import PDFMiner components
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams
from pdfminer.pdfdocument import PDFDocument
from pdfminer.pdfinterp import PDFResourceManager, PDFPageInterpreter
from pdfminer.pdfpage import PDFPage
from pdfminer.pdfparser import PDFParser

# Basic settings
settings.configure(
    DEBUG=True,
    ROOT_URLCONF=__name__,
    SECRET_KEY='a_very_secret_key',
    ALLOWED_HOSTS=['*'],
)

# Function to process PDF and extract text using PDFMiner
def extract_text_from_pdf(pdf_path):
    """Extract text from PDF using PDFMiner"""
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

# Function to classify document type
def classify_document(text):
    categories = {
        "Signed Permission Letter": ["permission letter", "signed letter", "approval"],
        "Offer Letter": ["offer letter", "employment offer", "job offer"],
        "Completion Certificate": ["completion certificate", "certification", "internship completed"],
        "Internship Report": ["internship report", "work summary", "project report"],
        "Student Feedback (About Internship)": ["student feedback", "internship experience", "review"],
        "Employer Feedback (About student)": ["employer feedback", "performance review", "student evaluation"]
    }
    
    for category, keywords in categories.items():
        if any(keyword.lower() in text.lower() for keyword in keywords):
            return f"Document Type: {category}"
    return "Document Type: Unknown"

# View function
def upload_pdf(request):
    if request.method == "POST" and request.FILES.get("pdf"):
        pdf_file = request.FILES["pdf"]
        pdf_path = f"/tmp/{pdf_file.name}"
        with open(pdf_path, "wb") as f:
            for chunk in pdf_file.chunks():
                f.write(chunk)
        
        try:
            extracted_text = extract_text_from_pdf(pdf_path)
            document_type = classify_document(extracted_text)
            result = f"{document_type}\n\nExtracted Text Preview:\n{extracted_text}..."
        except Exception as e:
            result = f"Error processing PDF: {str(e)}"
        
        try:
            os.remove(pdf_path)
        except:
            pass
            
        return HttpResponse(result)
    return HttpResponse("Upload a PDF via POST request.")

# URL patterns
urlpatterns = [
    path("upload/", upload_pdf),
]

# Create WSGI application
application = get_wsgi_application()

# Expose as 'app' for Vercel
app = application

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "__main__")
    execute_from_command_line(sys.argv)