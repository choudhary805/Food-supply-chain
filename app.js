// app.js
const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid'); // For generating unique order IDs

// Initialize Express app
const app = express();
app.use(bodyParser.json()); // Middleware to parse JSON request bodies

// In-memory data stores 
let inventory = [
  { id: 1, name: 'Apples', quantity: 100 },
  { id: 2, name: 'Bananas', quantity: 150 },
  { id: 3, name: 'Carrots', quantity: 200 },
];

let drivers = [
  { id: 'D1', name: 'Driver One', available: true },
  { id: 'D2', name: 'Driver Two', available: true },
  { id: 'D3', name: 'Driver Three', available: true },
];

let orders = []; // Stores all processed orders

// Helper Functions

/**
 * Finds an item in the inventory by its ID.
 * param {number} itemId - The ID of the item to find.
 * returns {object|null} - The inventory item or null if not found.
 */
const findItemInInventory = (itemId) => 
  inventory.find(item => item.id === itemId);

/**
 * Updates the inventory quantity for a specific item.
 * param {number} itemId - The ID of the item to update.
 * param {number} quantity - The quantity to deduct from the inventory.
 */
const updateInventoryItem = (itemId, quantity) => {
  const itemIndex = inventory.findIndex(item => item.id === itemId);
  if (itemIndex !== -1) {
    inventory[itemIndex].quantity -= quantity; // Deduct the quantity
  }
};

/**
 * Finds an available driver.
 * returns {object|null} - The first available driver or null if none are available.
 */
const findAvailableDriver = () => 
  drivers.find(driver => driver.available);

// Middleware Functions

/**
 * Validates if the items in the order are available in the inventory.
 * param {object} req - The request object.
 * param {object} res - The response object.
 * param {function} next - The next middleware function.
 */
const validateOrder = (req, res, next) => {
  const { items } = req.body;
  
  // Check each item in the order
  for (const item of items) {
    const inventoryItem = findItemInInventory(item.itemId);
    // If item not found or insufficient quantity, return an error
    if (!inventoryItem || inventoryItem.quantity < item.quantity) {
      return res.status(400).json({ 
        error: `Insufficient stock for item ${item.itemId}` 
      });
    }
  }
  
  // If all items are valid, proceed to the next middleware
  next();
};

/**
 * Processes the order by updating the inventory.
 * param {object} req - The request object.
 * param {object} res - The response object.
 * param {function} next - The next middleware function.
 */
const processOrder = (req, res, next) => {
  const { items } = req.body;
  
  try {
    // Update inventory for each item in the order
    items.forEach(item => {
      updateInventoryItem(item.itemId, item.quantity);
    });
    next(); // Proceed to the next middleware
  } catch (error) {
    // Handle inventory update errors
    res.status(500).json({ error: 'Inventory update failed' });
  }
};

/**
 * Assigns an available driver to the order.
 */
const assignDriver = (req, res, next) => {
  const driver = findAvailableDriver();
  
  // If no driver is available, return an error
  if (!driver) {
    return res.status(400).json({ error: 'No available drivers' });
  }
  
  // Mark the driver as unavailable and attach them to the request object
  driver.available = false;
  req.driver = driver;
  next(); // Proceed to the next middleware
};

// Routes

/**
 * POST /order - Endpoint to place an order.
 * Steps:
 * 1. Validate the order (validateOrder middleware).
 * 2. Process the order (processOrder middleware).
 * 3. Assign a driver (assignDriver middleware).
 * 4. Create the order and respond with confirmation.
 */
app.post('/order', validateOrder, processOrder, assignDriver, (req, res) => {
  const { restaurantId, items } = req.body;
  
  // Create the order object
  const order = {
    id: uuidv4(), // Generate a unique order ID
    restaurantId,
    items,
    driver: req.driver, // Attach the assigned driver
    timestamp: new Date().toISOString() // Add a timestamp
  };
  
  // Store the order in the orders array
  orders.push(order);
  
  // Respond with the order confirmation
  res.status(201).json({
    message: 'Order processed successfully',
    order
  });
});

/**
 * PUT /driver/:id/availability - Endpoint to update driver availability.
 * param {string} id - The ID of the driver to update.
 * param {boolean} available - The new availability status.
 */
app.put('/driver/:id/availability', (req, res) => {
  const driver = drivers.find(d => d.id === req.params.id);
  // If driver not found, return an error
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  
  // Update the driver's availability
  driver.available = req.body.available;
  res.json({ message: 'Driver availability updated', driver });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});