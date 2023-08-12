const { StatusCodes } = require('http-status-codes');
const CustomError = require('../errors');
const Cooker = require('../models/cooker');

const emailConfirmation = async (req, res) => {
  const token = req.query.token;
  const cooker = await Cooker.findOneAndUpdate(
    { emailToken: token },
    { isEmailApproved: true }
  );
  if (!cooker) {
    throw new CustomError.BadRequestError('Invalid token');
  }
  return res.status(StatusCodes.OK).json('Email confirmed successfully.');
};

module.exports = { emailConfirmation };
