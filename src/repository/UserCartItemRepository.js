/* eslint-disable no-param-reassign */
const uuid = require('uuid/v4');

class UserCartItemRepository {
  constructor(model) {
    this.model = model;
  }

  async findOne({
    productId, productAttribute, billingAddress, deliveryRate,
  }, userId) {
    if (typeof productId !== 'string') {
      throw new Error(`UserCartItem.findOne expected id as String, but got "${typeof productId}"`);
    }
    if (typeof userId !== 'string') {
      throw new Error(`UserCartItem.findOne expected id as String, but got "${typeof userId}"`);
    }
    // if (typeof billingAddress !== 'string') {
    //   throw new Error(`UserCartItem.findOne expected id as String, but got "${typeof billingAddress}"`);
    // }
    // if (typeof deliveryRate !== 'string') {
    //   throw new Error(`UserCartItem.findOne expected id as String, but got "${typeof deliveryRate}"`);
    // }

    return productAttribute
      ? this.model.findOne({
        product: productId, productAttribute, user: userId, billingAddress, deliveryRate,
      })
      : this.model.findOne({
        product: productId, user: userId, billingAddress, deliveryRate,
      });
  }

  async getById(itemId) {
    return this.model.findOne({ _id: itemId });
  }

  async applyDiscountCode(user, discount) {
    const cartItems = await this.model.find({ user, selected: true });
    for(let index=0;index<cartItems.length;index++){
      let cartItem=cartItems[index];
      let p = 0;
      const nowDateTime = new Date();
      const startDateTime = new Date(discount.startAt);
      const endDateTime = new Date(discount.endAt);
      if (discount.all_product === true) {
        p = 1;
      }else if (discount.products.findIndex((pro) => pro === cartItem.product) > -1) {
        p = 1;
        return cartItem;
      }else if (discount.products.findIndex((pro) => pro === cartItem.product) > -1) {
        p = 1;
        return cartItem;
      }else if (discount.isActive === true) {
        p = 1;
      } else if(startDateTime<nowDateTime && nowDateTime< endDateTime){
        p=1
      }
      else{
        p=0
      }
      console.log("it is able to add discount code", p)
      if (p === 1) {
        cartItem.discount = discount.id;
        await cartItem.save();
      }
    }
    return cartItems;
  }

  /**
   * @deprecated
   */
  async getAll(query = {}) {
    return this.model.find(query);
  }

  async getItemsByUser(userId, selected = false) {
    const query = { user: userId };
    if (selected) query.selected = true;
    return this.model.find(query);
  }

  async add({
    productId, deliveryRateId, quantity, billingAddress, productAttribute, note,
  }, userId) {
    const query = { productId, productAttribute, billingAddress };
    if (deliveryRateId) {
      query.deliveryRate = deliveryRateId;
    }
    return this.findOne(query, userId)
      .then((cartItem) => {
        if (cartItem) {
          cartItem.quantity += quantity;
          cartItem.deliveryRate = deliveryRateId;
          return cartItem.save();
        }

        return this.model.create({
          _id: uuid(),
          product: productId,
          deliveryRate: deliveryRateId,
          user: userId,
          quantity,
          billingAddress,
          productAttribute,
          note,
        });
      });
  }

  async delete(itemId) {
    if (typeof itemId !== 'string') {
      throw new Error(`UserCartItem.delete expected id as String, but got "${typeof itemId}"`);
    }

    return this.model.deleteOne({ _id: itemId });
  }

  async update(userCartId, { deliveryRateId, quantity, note }) {
    return this.getById(userCartId)
      .then((cartItem) => {
        cartItem.quantity = quantity;
        cartItem.deliveryRate = deliveryRateId;
        cartItem.note = note;
        return cartItem.save();
      });
  }

  async clear(userId, selected = null) {
    if (typeof userId !== 'string') {
      throw new Error(`UserCartItem.clear expected id as String, but got "${typeof userId}"`);
    }
    const query = { user: userId };
    if (typeof selected === 'boolean' && selected === true) {
      query.selected = true;
    }
    return this.model.deleteMany(query);
  }
}

module.exports = UserCartItemRepository;
