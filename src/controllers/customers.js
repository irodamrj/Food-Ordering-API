const CustomerModel = require('../models/customer');
const Dish = require('../models/dish');
const CustomError = require('../errors');
const AddressModel = require('../models/address');
const { StatusCodes } = require('http-status-codes');

const getProfile = async (req, res) => {
  const customer = await CustomerModel.findOne({ email: req.auth.email })
    .populate('address')
    .populate('cart');
  return res.status(StatusCodes.OK).json({ customer });
};

const updateProfile = async (req, res) => {
  const { address, phoneNumber, profilePicture, firstName, lastName } =
    req.body;

  const customerAddressId = await CustomerModel.findOne(
    { email: req.auth.email },
    { address: 1, _id: 0 }
  );

  let newAddress;
  if (!customerAddressId.address && address) {
    newAddress = await AddressModel.create(address);
  }

  if (customerAddressId && address) {
    await AddressModel.findOneAndUpdate(
      {
        _id: customerAddressId.address,
      },
      address
    );
  }

  const updatedCustomer = await CustomerModel.findOneAndUpdate(
    { email: req.auth.email },
    { phoneNumber, profilePicture, address: newAddress, firstName, lastName },
    { new: true }
  ).populate('address');

  return res.status(StatusCodes.OK).json(updatedCustomer);
};

const deleteProfile = async (req, res) => {
  const customer = await CustomerModel.findOne({ email: req.auth.email });

  if (customer.address) {
    const addressIds = customer.address;
    await AddressModel.findByIdAndDelete({ _id: addressIds });
  }
  await customer.deleteOne();

  res.clearCookie('token', {
    signed: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 14 * 1000,
  });

  return res.status(StatusCodes.OK).json('user is deleted and logout');
};

const getCart = async (req, res) => {
  const customer = await CustomerModel.findOne(
    { email: req.auth.email },
    { _id: 0, cart: 1 }
  );
  return res.status(StatusCodes.OK).json({ customer });
};

const resetCart = async (req, res) => {
  const customer = await CustomerModel.findOneAndUpdate(
    { email: req.auth.email },
    {
      'cart.itemId': [],
      'cart.total': 0,
    },
    { new: true }
  );
  res.status(StatusCodes.OK).json(customer.cart);
};

const createCart = async (req, res) => {
  const customer = await CustomerModel.findOne({ email: req.auth.email });
  const cartItemsIds = customer.cart.itemId.map((e) => e);
  const oldCooker = await Dish.findOne(
    { _id: cartItemsIds[0] },
    { cookerId: 1, _id: 0 }
  );

  if (!req.body.itemId) {
    throw new CustomError.BadRequestError('Cart data incomplete');
  }
  let itemIds = req.body.itemId;
  let tempTotal = 0;
  let tempCookerId = [];
  for (let i = 0; i < itemIds.length; i++) {
    let singleItem = await Dish.findById({ _id: itemIds[i] });
    if (!singleItem) {
      throw new CustomError.NotFoundError(
        `dish with id ${itemIds[i]} not found`
      );
    }

    if (oldCooker && !singleItem.cookerId.equals(oldCooker.cookerId)) {
      throw new CustomError.BadRequestError(
        'Cannot add dishes from multiple reaturants. To add this item, delete your cart.'
      );
    }

    if (
      tempCookerId.length > 0 &&
      !singleItem.cookerId.equals(tempCookerId[0])
    ) {
      throw new CustomError.BadRequestError(
        'Cannot add dishes from multiple resaturants. To add this item, delete your cart.'
      );
    }

    tempCookerId.push(singleItem.cookerId);

    customer.cart.itemId.push(singleItem._id);
    tempTotal += singleItem.price;
  }

  customer.cart.total += tempTotal;
  const updatedCustomer = await customer.save();
  return res.status(StatusCodes.OK).json({ updatedCustomer });
};

const changePassword = async (req, res) => {
  const { password, newPassword1, newPasswordAgain } = req.body;
  const customer = await CustomerModel.findOne({ email: req.auth.email });
  if (customer.providerId) {
    throw new CustomError.BadRequestError(
      'Cannot change password, since customer signed in using Identity provider services.'
    );
  }
  if (!password || !newPassword1 || !newPasswordAgain) {
    throw new CustomError.BadRequestError(
      'Password, new password and confirmation of new password cannot be empty.'
    );
  }
  if (newPassword1 === newPasswordAgain) {
    throw new CustomError.BadRequestError(
      'Password, new password and confirmation of new password cannot be empty.'
    );
  }
  const isValid = await bcrypt.compare(password, customer.password);
  if (!isValid) {
    throw new CustomError.BadRequestError('Invalid password.');
  }

  const newHashedPassword = await bcrypt.hash(newPassword1, 10);
  await CustomerModel.findOneAndUpdate(
    { email: req.auth.email },
    { password: newHashedPassword },
    { new: true }
  );
  return res.status(StatusCodes.OK).json('Password updated successfully.');
};

module.exports = {
  getProfile,
  updateProfile,
  deleteProfile,
  getCart,
  resetCart,
  createCart,
  changePassword,
};
