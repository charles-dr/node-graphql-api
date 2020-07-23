const path = require('path');
const { Validator } = require('node-input-validator');
const { ApolloError } = require('apollo-server');

const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));

const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository } }) => {

    const validator = new Validator(args.data, {
        request_id: 'required',
        code:'required'
    });

    return validator.check()
        .then(async (matched) => {
            if (!matched) {
                throw errorHandler.build(validator.errors);
            }
        })
        .then(() => repository.verificationCode.checkVerificationCode({ id:args.data.request_id, code: args.data.code }))
        .then((status) => {
            if(status===true){
                return {
                    result: true,
                    message: '',
                    code: "SUCCESS",
                }
            }else{
                return {
                    result: false,
                    message: 'Your code does not match',
                    code: "FAILED",
                }
            }
        })
        .catch((err) => {
            throw new ApolloError(err);
        })

};
