1. Order request need restrauntId and items. Then validate each item in restraunt inventry. The inventory should check if each item exists and has enough quantity. If any item is missing or insufficient, the API should respond with an error.
2. Processing the order. If all items are valid, I need to update the inventory. Each item's quantity should be reduced by the ordered amount. 
3. Then, assigning a driver. The drivers need to have an availability status. The logic here is to find the first available driver and mark them as unavailable. If no drivers are available, the order can't be processed, so another error response.

NOTE:
As sample data I take : inventory has items with id, name, quantity. Drivers have id, name, and available status. The order confirmation should include order details, driver info, and a timestamp.

Edge Case: There might be two orders come in at the same time? Since it's in-memory, there might be concurrency issues. Proceed with the simple solution.

Error handling : Check all possible failure points: invalid items, insufficient stock, no drivers. Send appropriate HTTP status codes and messages.

Testing via POSTMAN: 
When an order is placed, validate each item. If any invalid, return 400. Then update each item's quantity. Assign driver, if none, return 400. Then send back the confirmation with the assigned driver.

POSTMAN :-(a). POST http://localhost:3000/order
                    "Content-Type: application/json"
                    {
                        "restaurantId": "R123",
                        "items": [
                        { "itemId": 1, "quantity": 10 },
                        { "itemId": 2, "quantity": 20 }
                        ]
                    }


        Response:
                    {
                    "message": "Order processed successfully",
                    "order": {
                        "id": "a1b2c3d4...",
                        "restaurantId": "R123",
                        "items": [...],
                        "driver": { "id": "D1", ... },
                        "timestamp": "2025-03-04T12:34:56.789Z"
                    }
                    }

(b). Update Driver Availability:
PUT http://localhost:3000/driver/D1/availability 
"Content-Type: application/json"
{
    "available": false
  }