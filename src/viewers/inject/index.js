const path = require('path');
const repository = require(path.resolve('src/repository'));

function random(low, high) {
    return Math.ceil(Math.random() * (high - low)) + low
}

function setData(time, view=0, like=0) {
    var data = {}
    const timelist = [1200, 660, 420, 240, 120, 60, 20]
    const viewlimit = [60, 46, 31, 21, 11, 6, 3, 1]
    const likelimit = [45, 34, 25, 17, 8, 4, 2, 1]
    let index = 0 
    for (let i = 0; i < timelist.length; i++) {
        if ( time < timelist[i] ) {
            index = i
        }
    }
    if ( index == 0 ) {
        data.viewers = view
        data.likes = like
        return data
    }
    data.views = random(viewlimit[index+1], viewlimit[index])
    data.likes = random(likelimit[index+1], likelimit[index])
    return data;
}

module.exports = (req, res) => {
    try {
        let ids = []
        let lengths = [] 
        repository.liveStream.getAll({type: "pre-recorded"})
            .then((live) =>{
                live.forEach(function(ele) {
                    ids.push(ele._id);
                    lengths.push(ele.length)
                })
            })
            .then(() => {
                for (let i = 0; i < ids.length;i++) {
                    let data = setData(lengths[i])
                    repository.liveStream.update(ids[i], data, 1)
                }
            })
            .then(() => {
                res.send({status: "successful inject"})
            })
    } catch (error) {
        console.log(error.message);
    }
};
  