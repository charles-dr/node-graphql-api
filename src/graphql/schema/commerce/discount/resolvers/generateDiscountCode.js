const path = require('path');
const { Validator } = require('node-input-validator');
const uuid = require('uuid/v4');
const ProductService = require(path.resolve('src/lib/ProductService'));
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const { UserInputError, ApolloError, ForbiddenError } = require('apollo-server');

const errorHandler = new ErrorHandler();
const codeLength=10
const candidates='123456789ABCDEFGHJKLMNPQRSTUVWXYZ/!#';
module.exports = async (obj, args, { dataSources: { repository }, user }) => {
    const validator = new Validator(
        args,
        { startAt: ['required'] },
        { endAt: 'required' },
        { amount: 'required|min:1|integer' },
    );

    return validator.check()
        .then(async (matched) => {
            if (!matched) {
                throw errorHandler.build(validator.errors);
            }
            let code = '';
            for (let i = 0; i < codeLength; i += 1) {
                code += candidates.charAt(Math.floor(Math.random() * candidates.length));
            }
            let data = {
                _id: uuid(),
                user: user.id,
                code,
                ...args
            }
            return repository.discount.create(data);
        })
        .catch((error) => {
            console.log(error);
            throw new ApolloError(`Failed to add Product to Cart. Original error: ${error.message}`, 400);
        });
};
