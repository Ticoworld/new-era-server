const express = require('express');
const jwt = require('jsonwebtoken');
const Product = require('../model/product.model'); 
const router = express.Router();
const Admin = require('../model/admin.model');

// Get all products
router.get('/getproducts', async (req, res) => {
  try {
    const products = await Product.find({});
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a new product
router.post('/addproduct', async (req, res) => {
    const token = req.headers["x-access-token"];
  const { name, image } = req.body;
  if(!token) {
    return res.status(401).json({success: false, message: 'Access token missing'});
}
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const admin = await Admin.findOne({ email: email });
    if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }
    const newProduct = new Product({
      name,
      image,
    });
    await newProduct.save();
    res.json({success: true, newProduct});
  } catch (err) {
    res.status(500).json({ message: 'Error adding product' });
  }
});

// Update a product
router.put('/updateproduct/:id', async (req, res) => {
    const token = req.headers["x-access-token"];

  const { name, image } = req.body;
  if(!token) {
    return res.status(401).json({success: false, message: 'Access token missing'});
}
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;
    const admin = await Admin.findOne({ email: email });
    if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin not found' });
      }
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, image },
      { new: true }
    );
    res.json({success: true, updatedProduct});
  } catch (err) {
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Delete a product
router.delete('/deleteproduct/:id', async (req, res) => {
    const token = req.headers["x-access-token"];

    if(!token) {
        return res.status(401).json({success: false, message: 'Access token missing'});
    }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const email = decoded.email;
        const admin = await Admin.findOne({ email: email });
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
          }
    await Product.findByIdAndDelete(req.params.id);
    res.json({success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({success: false, message: 'Error deleting product' });
  }
});

// Bulk upload products
// router.post('/products/bulk', async (req, res) => {
    
//     const products = req.body; 
    
//     try {
//       const result = await Product.insertMany(products);
//       res.json({ message: 'Products added successfully', data: result });
//     } catch (err) {
//       res.status(500).json({ message: 'Error uploading products' });
//     }
//   });
  

module.exports = router;
