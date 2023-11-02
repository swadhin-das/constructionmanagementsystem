const Customer = require("../models/Customer");
const mongoose = require("mongoose");
const multer = require('multer');
const fs = require("fs");
const upload = multer({dest:"uploads/"});

exports.homepage = async (req, res) => {
  try {
    const perPage = 12;
    const page = parseInt(req.query.page) || 1;

    const customers = await Customer.find({})
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();

    const count = await Customer.countDocuments();

    const locals = {
      title: 'NodeJs',
      description: 'Free NodeJs User Management System',
    };

    const messages = await req.flash('info');

    res.render('index', {
      locals,
      customers,
      current: page,
      pages: Math.ceil(count / perPage),
      messages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.about = async (req, res) => {
  const locals = {
    title: 'About',
    description: 'Free NodeJs User Management System',
  };

  try {
    res.render('about', locals);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.addCustomer = (req, res) => {
  const locals = {
    title: "Add New Customer - NodeJs",
    description: "Free NodeJs User Management System",
  };

  res.render("customer/add", locals);
};

exports.postCustomer = async (req, res) => {
  try {
    const { firstName, lastName, details, tel, email, profileImage } = req.body;
    console.log('Received data:', { firstName, lastName, details, tel, email , profileImage});
    if (!firstName || !lastName || !tel || !email) {
      // Handle validation errors by returning an error response.
      return res.status(400).send('Please fill in all required fields.');
    }

    const newCustomer = new Customer({
      firstName,
      lastName,
      details,
      tel,
      email,
      profileImage,
    });

    if (req.file) {
      // If a file was uploaded, store its details in the customer object
      newCustomer.profileImage = req.file.filename;
      console.log( req.file.filename);
    }

    await newCustomer.save();
    // Assuming you're using connect-flash for flash messages
    req.flash('info', 'New data has been added.');
    res.redirect('/secrets');
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
};


exports.view = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404).send("Customer not found.");
      return;
    }

    const locals = {
      title: "View Customer Data",
      description: "Free NodeJs User Management System",
    };

    res.render('customer/view', { locals, customer });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.edit = async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      res.status(404).send("Customer not found.");
      return;
    }

    const locals = {
      title: "Edit Customer Data",
      description: "Free NodeJs User Management System",
    };

    res.render('customer/edit', { locals, customer });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.editPost = async (req, res) => {
  try {
    const { firstName, lastName, tel, email, details } = req.body;
    await Customer.findByIdAndUpdate(req.params.id, { firstName, lastName, tel, email, details, updatedAt: Date.now() });
    res.redirect(`/edit/${req.params.id}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    await Customer.findByIdAndRemove(req.params.id);
    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};

exports.searchCustomers = async (req, res) => {
  const locals = {
    title: "Search Customer Data",
    description: "Free NodeJs User Management System",
  };

  try {
    const searchTerm = req.body.searchTerm;
    const searchNoSpecialChar = searchTerm.replace(/[^a-zA-Z0-9 ]/g, "");

    const customers = await Customer.find({
      $or: [
        { firstName: { $regex: new RegExp(searchNoSpecialChar, "i") }},
        { lastName: { $regex: new RegExp(searchNoSpecialChar, "i") }},
      ],
    });

    res.render("search", { customers, locals });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
