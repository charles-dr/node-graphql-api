const uuid = require('uuid/v4');
const path = require('path');
const { ErrorHandler } = require(path.resolve('src/lib/ErrorHandler'));
const errorHandler = new ErrorHandler();

module.exports = async (obj, args, { dataSources: { repository } }) => {
    return repository.user.deleteUser(args.id)
        .then((result) => {

            if( result.deletedCount > 0 )
                return { success: true }
            else    
                return { success: false }
        })
        .catch(e => {
            return { success: false }
        })
};
