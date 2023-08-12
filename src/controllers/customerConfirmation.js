const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const Customer = require('../models/customer');

const emailConfirmation = async (req, res) => {
  const token = req.query.token;
  const customer = await Customer.findOneAndUpdate(
    { emailToken: token },
    { isEmailApproved: true }
  );
  if (!customer) {
    throw new CustomError.BadRequestError('Invalid token');
  }
  return res.status(StatusCodes.OK).json('Email confirmed successfully.');
};

module.exports = { emailConfirmation };
