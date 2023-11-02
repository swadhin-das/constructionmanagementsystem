const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

/**
 *  Customer Routes 
*/
router.get('/', customerController.homepage);
router.get('/add', customerController.addCustomer);
router.post('/add', customerController.postCustomer);

// router.post('/upload',customerController.upload);

router.get('/view/:id', customerController.view);

router.get('/edit/:id', customerController.edit);
router.post('/edit/:id', customerController.editPost);
router.delete('/edit/:id', customerController.deleteCustomer);

router.get('/about', customerController.about);

router.post('/search', customerController.searchCustomers);




module.exports = router;