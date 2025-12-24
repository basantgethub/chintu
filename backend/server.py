from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import resend

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Resend configuration
resend.api_key = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')

# Create the main app
app = FastAPI(title="Lata Dairy Management System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

# Product Models
class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    unit: str  # liter, kg, piece
    price: float
    description: Optional[str] = ""
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class ProductCreate(BaseModel):
    name: str
    category: str
    unit: str
    price: float
    description: Optional[str] = ""

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    price: Optional[float] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

# Customer Models
class Customer(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    address: str
    email: Optional[str] = ""
    outstanding_balance: float = 0.0
    credit_limit: float = 5000.0
    is_active: bool = True
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class CustomerCreate(BaseModel):
    name: str
    phone: str
    address: str
    email: Optional[str] = ""
    credit_limit: float = 5000.0

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
    credit_limit: Optional[float] = None
    is_active: Optional[bool] = None

# Daily Sale Models
class SaleItem(BaseModel):
    product_id: str
    product_name: str
    quantity: float
    unit: str
    price: float
    total: float

class DailySale(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_name: str
    date: str  # YYYY-MM-DD format
    items: List[SaleItem]
    total_amount: float
    paid_amount: float = 0.0
    is_paid: bool = False
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class DailySaleCreate(BaseModel):
    customer_id: str
    date: str
    items: List[SaleItem]
    paid_amount: float = 0.0

# Guest Sale Models
class GuestSale(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    guest_name: Optional[str] = "Walk-in Customer"
    guest_phone: Optional[str] = ""
    date: str
    items: List[SaleItem]
    total_amount: float
    payment_method: str = "cash"
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class GuestSaleCreate(BaseModel):
    guest_name: Optional[str] = "Walk-in Customer"
    guest_phone: Optional[str] = ""
    items: List[SaleItem]
    payment_method: str = "cash"

# Monthly Bill Models
class MonthlyBill(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    customer_id: str
    customer_name: str
    month: int
    year: int
    total_sales: float
    total_paid: float
    balance_due: float
    sales_count: int
    generated_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    email_sent: bool = False

# Email Models
class EmailRequest(BaseModel):
    recipient_email: EmailStr
    subject: str
    html_content: str

class BillEmailRequest(BaseModel):
    bill_id: str
    recipient_email: EmailStr

# ==================== PRODUCT ROUTES ====================

@api_router.get("/products", response_model=List[Product])
async def get_products(active_only: bool = False):
    query = {"is_active": True} if active_only else {}
    products = await db.products.find(query, {"_id": 0}).to_list(1000)
    return products

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@api_router.post("/products", response_model=Product)
async def create_product(data: ProductCreate):
    product = Product(**data.model_dump())
    doc = product.model_dump()
    await db.products.insert_one(doc)
    return product

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, data: ProductUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    result = await db.products.update_one({"id": product_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    product = await db.products.find_one({"id": product_id}, {"_id": 0})
    return product

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

@api_router.get("/product-categories")
async def get_product_categories():
    categories = await db.products.distinct("category")
    return categories

# ==================== CUSTOMER ROUTES ====================

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(active_only: bool = False):
    query = {"is_active": True} if active_only else {}
    customers = await db.customers.find(query, {"_id": 0}).to_list(1000)
    return customers

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@api_router.post("/customers", response_model=Customer)
async def create_customer(data: CustomerCreate):
    customer = Customer(**data.model_dump())
    doc = customer.model_dump()
    await db.customers.insert_one(doc)
    return customer

@api_router.put("/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, data: CustomerUpdate):
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No data to update")
    result = await db.customers.update_one({"id": customer_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    return customer

@api_router.delete("/customers/{customer_id}")
async def delete_customer(customer_id: str):
    result = await db.customers.delete_one({"id": customer_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}

# ==================== DAILY SALES ROUTES ====================

@api_router.get("/daily-sales", response_model=List[DailySale])
async def get_daily_sales(
    customer_id: Optional[str] = None,
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    query = {}
    if customer_id:
        query["customer_id"] = customer_id
    if date:
        query["date"] = date
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    sales = await db.daily_sales.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return sales

@api_router.get("/daily-sales/{sale_id}", response_model=DailySale)
async def get_daily_sale(sale_id: str):
    sale = await db.daily_sales.find_one({"id": sale_id}, {"_id": 0})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale

@api_router.post("/daily-sales", response_model=DailySale)
async def create_daily_sale(data: DailySaleCreate):
    # Get customer details
    customer = await db.customers.find_one({"id": data.customer_id}, {"_id": 0})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    
    # Calculate total
    total_amount = sum(item.total for item in data.items)
    
    sale = DailySale(
        customer_id=data.customer_id,
        customer_name=customer["name"],
        date=data.date,
        items=data.items,
        total_amount=total_amount,
        paid_amount=data.paid_amount,
        is_paid=data.paid_amount >= total_amount
    )
    
    # Update customer balance
    balance_change = total_amount - data.paid_amount
    await db.customers.update_one(
        {"id": data.customer_id},
        {"$inc": {"outstanding_balance": balance_change}}
    )
    
    doc = sale.model_dump()
    await db.daily_sales.insert_one(doc)
    return sale

@api_router.put("/daily-sales/{sale_id}/payment")
async def update_sale_payment(sale_id: str, paid_amount: float):
    sale = await db.daily_sales.find_one({"id": sale_id}, {"_id": 0})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    old_paid = sale.get("paid_amount", 0)
    new_paid = paid_amount
    balance_change = old_paid - new_paid  # If paying more, balance decreases
    
    is_paid = new_paid >= sale["total_amount"]
    
    await db.daily_sales.update_one(
        {"id": sale_id},
        {"$set": {"paid_amount": new_paid, "is_paid": is_paid}}
    )
    
    await db.customers.update_one(
        {"id": sale["customer_id"]},
        {"$inc": {"outstanding_balance": balance_change}}
    )
    
    return {"message": "Payment updated successfully"}

@api_router.delete("/daily-sales/{sale_id}")
async def delete_daily_sale(sale_id: str):
    sale = await db.daily_sales.find_one({"id": sale_id}, {"_id": 0})
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    
    # Revert customer balance
    balance_change = -(sale["total_amount"] - sale.get("paid_amount", 0))
    await db.customers.update_one(
        {"id": sale["customer_id"]},
        {"$inc": {"outstanding_balance": balance_change}}
    )
    
    await db.daily_sales.delete_one({"id": sale_id})
    return {"message": "Sale deleted successfully"}

# ==================== GUEST SALES ROUTES ====================

@api_router.get("/guest-sales", response_model=List[GuestSale])
async def get_guest_sales(date: Optional[str] = None):
    query = {"date": date} if date else {}
    sales = await db.guest_sales.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return sales

@api_router.post("/guest-sales", response_model=GuestSale)
async def create_guest_sale(data: GuestSaleCreate):
    total_amount = sum(item.total for item in data.items)
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    sale = GuestSale(
        guest_name=data.guest_name,
        guest_phone=data.guest_phone,
        date=today,
        items=data.items,
        total_amount=total_amount,
        payment_method=data.payment_method
    )
    
    doc = sale.model_dump()
    await db.guest_sales.insert_one(doc)
    return sale

# ==================== BILLING ROUTES ====================

@api_router.get("/billing/monthly")
async def get_monthly_bills(month: int, year: int):
    bills = await db.monthly_bills.find(
        {"month": month, "year": year}, {"_id": 0}
    ).to_list(1000)
    return bills

@api_router.get("/billing/customer/{customer_id}")
async def get_customer_bills(customer_id: str):
    bills = await db.monthly_bills.find(
        {"customer_id": customer_id}, {"_id": 0}
    ).sort([("year", -1), ("month", -1)]).to_list(100)
    return bills

@api_router.post("/billing/generate")
async def generate_monthly_bills(month: int, year: int):
    # Get all active customers
    customers = await db.customers.find({"is_active": True}, {"_id": 0}).to_list(1000)
    
    # Date range for the month
    start_date = f"{year}-{month:02d}-01"
    if month == 12:
        end_date = f"{year + 1}-01-01"
    else:
        end_date = f"{year}-{month + 1:02d}-01"
    
    bills_generated = []
    
    for customer in customers:
        # Get sales for this customer in this month
        sales = await db.daily_sales.find({
            "customer_id": customer["id"],
            "date": {"$gte": start_date, "$lt": end_date}
        }, {"_id": 0}).to_list(1000)
        
        if not sales:
            continue
        
        total_sales = sum(s["total_amount"] for s in sales)
        total_paid = sum(s.get("paid_amount", 0) for s in sales)
        
        # Check if bill already exists
        existing = await db.monthly_bills.find_one({
            "customer_id": customer["id"],
            "month": month,
            "year": year
        })
        
        bill_data = {
            "customer_id": customer["id"],
            "customer_name": customer["name"],
            "month": month,
            "year": year,
            "total_sales": total_sales,
            "total_paid": total_paid,
            "balance_due": total_sales - total_paid,
            "sales_count": len(sales),
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "email_sent": False
        }
        
        if existing:
            await db.monthly_bills.update_one(
                {"customer_id": customer["id"], "month": month, "year": year},
                {"$set": bill_data}
            )
            bill_data["id"] = existing.get("id", str(uuid.uuid4()))
        else:
            bill_data["id"] = str(uuid.uuid4())
            await db.monthly_bills.insert_one(bill_data)
        
        bills_generated.append(bill_data)
    
    return {"message": f"Generated {len(bills_generated)} bills", "bills": bills_generated}

@api_router.get("/billing/{bill_id}")
async def get_bill_details(bill_id: str):
    bill = await db.monthly_bills.find_one({"id": bill_id}, {"_id": 0})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    # Get detailed sales
    start_date = f"{bill['year']}-{bill['month']:02d}-01"
    if bill['month'] == 12:
        end_date = f"{bill['year'] + 1}-01-01"
    else:
        end_date = f"{bill['year']}-{bill['month'] + 1:02d}-01"
    
    sales = await db.daily_sales.find({
        "customer_id": bill["customer_id"],
        "date": {"$gte": start_date, "$lt": end_date}
    }, {"_id": 0}).sort("date", 1).to_list(1000)
    
    return {"bill": bill, "sales": sales}

# ==================== DASHBOARD ROUTES ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    current_month = datetime.now(timezone.utc).month
    current_year = datetime.now(timezone.utc).year
    
    # Today's stats
    today_sales = await db.daily_sales.find({"date": today}, {"_id": 0}).to_list(1000)
    today_guest_sales = await db.guest_sales.find({"date": today}, {"_id": 0}).to_list(1000)
    
    today_revenue = sum(s["total_amount"] for s in today_sales) + sum(s["total_amount"] for s in today_guest_sales)
    today_transactions = len(today_sales) + len(today_guest_sales)
    
    # Monthly stats
    start_date = f"{current_year}-{current_month:02d}-01"
    if current_month == 12:
        end_date = f"{current_year + 1}-01-01"
    else:
        end_date = f"{current_year}-{current_month + 1:02d}-01"
    
    month_sales = await db.daily_sales.find({
        "date": {"$gte": start_date, "$lt": end_date}
    }, {"_id": 0}).to_list(10000)
    month_guest_sales = await db.guest_sales.find({
        "date": {"$gte": start_date, "$lt": end_date}
    }, {"_id": 0}).to_list(10000)
    
    month_revenue = sum(s["total_amount"] for s in month_sales) + sum(s["total_amount"] for s in month_guest_sales)
    
    # Outstanding balance
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    total_outstanding = sum(c.get("outstanding_balance", 0) for c in customers)
    
    # Counts
    total_customers = await db.customers.count_documents({"is_active": True})
    total_products = await db.products.count_documents({"is_active": True})
    
    return {
        "today_revenue": today_revenue,
        "today_transactions": today_transactions,
        "month_revenue": month_revenue,
        "total_outstanding": total_outstanding,
        "total_customers": total_customers,
        "total_products": total_products,
        "month_sales_count": len(month_sales) + len(month_guest_sales)
    }

@api_router.get("/dashboard/sales-chart")
async def get_sales_chart(days: int = 7):
    from datetime import timedelta
    
    end_date = datetime.now(timezone.utc)
    start_date = end_date - timedelta(days=days)
    
    chart_data = []
    current = start_date
    
    while current <= end_date:
        date_str = current.strftime("%Y-%m-%d")
        
        daily = await db.daily_sales.find({"date": date_str}, {"_id": 0}).to_list(1000)
        guest = await db.guest_sales.find({"date": date_str}, {"_id": 0}).to_list(1000)
        
        revenue = sum(s["total_amount"] for s in daily) + sum(s["total_amount"] for s in guest)
        
        chart_data.append({
            "date": date_str,
            "day": current.strftime("%a"),
            "revenue": revenue,
            "transactions": len(daily) + len(guest)
        })
        
        current += timedelta(days=1)
    
    return chart_data

@api_router.get("/dashboard/top-customers")
async def get_top_customers(limit: int = 5):
    # Get customers with highest purchases this month
    current_month = datetime.now(timezone.utc).month
    current_year = datetime.now(timezone.utc).year
    
    start_date = f"{current_year}-{current_month:02d}-01"
    if current_month == 12:
        end_date = f"{current_year + 1}-01-01"
    else:
        end_date = f"{current_year}-{current_month + 1:02d}-01"
    
    pipeline = [
        {"$match": {"date": {"$gte": start_date, "$lt": end_date}}},
        {"$group": {
            "_id": "$customer_id",
            "customer_name": {"$first": "$customer_name"},
            "total_purchases": {"$sum": "$total_amount"},
            "purchase_count": {"$sum": 1}
        }},
        {"$sort": {"total_purchases": -1}},
        {"$limit": limit}
    ]
    
    results = await db.daily_sales.aggregate(pipeline).to_list(limit)
    return [{"customer_id": r["_id"], "customer_name": r["customer_name"], 
             "total_purchases": r["total_purchases"], "purchase_count": r["purchase_count"]} 
            for r in results]

@api_router.get("/dashboard/top-products")
async def get_top_products(limit: int = 5):
    current_month = datetime.now(timezone.utc).month
    current_year = datetime.now(timezone.utc).year
    
    start_date = f"{current_year}-{current_month:02d}-01"
    if current_month == 12:
        end_date = f"{current_year + 1}-01-01"
    else:
        end_date = f"{current_year}-{current_month + 1:02d}-01"
    
    pipeline = [
        {"$match": {"date": {"$gte": start_date, "$lt": end_date}}},
        {"$unwind": "$items"},
        {"$group": {
            "_id": "$items.product_id",
            "product_name": {"$first": "$items.product_name"},
            "total_quantity": {"$sum": "$items.quantity"},
            "total_revenue": {"$sum": "$items.total"}
        }},
        {"$sort": {"total_revenue": -1}},
        {"$limit": limit}
    ]
    
    results = await db.daily_sales.aggregate(pipeline).to_list(limit)
    return [{"product_id": r["_id"], "product_name": r["product_name"],
             "total_quantity": r["total_quantity"], "total_revenue": r["total_revenue"]}
            for r in results]

# ==================== EMAIL ROUTES ====================

@api_router.post("/send-email")
async def send_email(request: EmailRequest):
    if not resend.api_key:
        raise HTTPException(status_code=500, detail="Email service not configured")
    
    params = {
        "from": SENDER_EMAIL,
        "to": [request.recipient_email],
        "subject": request.subject,
        "html": request.html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        return {
            "status": "success",
            "message": f"Email sent to {request.recipient_email}",
            "email_id": email.get("id")
        }
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

@api_router.post("/billing/send-email")
async def send_bill_email(request: BillEmailRequest):
    # Get bill details
    bill = await db.monthly_bills.find_one({"id": request.bill_id}, {"_id": 0})
    if not bill:
        raise HTTPException(status_code=404, detail="Bill not found")
    
    # Generate HTML content
    month_names = ["", "January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December"]
    month_name = month_names[bill["month"]]
    
    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1e3a8a; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Lata Dairy</h1>
            <p style="margin: 5px 0 0 0;">Monthly Bill Statement</p>
        </div>
        
        <div style="padding: 20px; background: #fdfbf7;">
            <p>Dear <strong>{bill['customer_name']}</strong>,</p>
            <p>Please find below your bill statement for <strong>{month_name} {bill['year']}</strong>.</p>
            
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <tr style="background: #f5f5f4;">
                    <td style="padding: 10px; border: 1px solid #e7e5e4;"><strong>Total Purchases</strong></td>
                    <td style="padding: 10px; border: 1px solid #e7e5e4; text-align: right;">₹{bill['total_sales']:.2f}</td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e7e5e4;"><strong>Amount Paid</strong></td>
                    <td style="padding: 10px; border: 1px solid #e7e5e4; text-align: right;">₹{bill['total_paid']:.2f}</td>
                </tr>
                <tr style="background: #fef2f2;">
                    <td style="padding: 10px; border: 1px solid #e7e5e4;"><strong>Balance Due</strong></td>
                    <td style="padding: 10px; border: 1px solid #e7e5e4; text-align: right; color: #dc2626;"><strong>₹{bill['balance_due']:.2f}</strong></td>
                </tr>
                <tr>
                    <td style="padding: 10px; border: 1px solid #e7e5e4;"><strong>Number of Transactions</strong></td>
                    <td style="padding: 10px; border: 1px solid #e7e5e4; text-align: right;">{bill['sales_count']}</td>
                </tr>
            </table>
            
            <p>Thank you for your continued trust in Lata Dairy.</p>
            <p style="color: #78716c; font-size: 14px;">If you have any questions, please contact us.</p>
        </div>
        
        <div style="background: #1c1917; color: white; padding: 15px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">© {bill['year']} Lata Dairy. All rights reserved.</p>
        </div>
    </div>
    """
    
    if not resend.api_key:
        raise HTTPException(status_code=500, detail="Email service not configured")
    
    params = {
        "from": SENDER_EMAIL,
        "to": [request.recipient_email],
        "subject": f"Lata Dairy - Bill Statement for {month_name} {bill['year']}",
        "html": html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        
        # Update bill email status
        await db.monthly_bills.update_one(
            {"id": request.bill_id},
            {"$set": {"email_sent": True}}
        )
        
        return {
            "status": "success",
            "message": f"Bill sent to {request.recipient_email}",
            "email_id": email.get("id")
        }
    except Exception as e:
        logger.error(f"Failed to send bill email: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to send email: {str(e)}")

# ==================== ROOT ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Lata Dairy Management System API", "version": "1.0.0"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
