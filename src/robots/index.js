const CancelLiveStreamRobot = require('./logics/CancelLiveStreamRobot');
const UpdateProductCountRobot = require('./logics/UpdateProductCountRobot');
const UpdateStreamCountRobot = require('./logics/UpdateStreamCountRobot');

const LiveStreamVideoTagRobot = require('./logics/LiveStreamVideoTagRobot');
const ProductHashtagRobot = require('./logics/ProductHashtagRobot');
const TranslateBrandRobot = require('./logics/TranslateBrandRobot');
const TranslateLiveStreamRobot = require('./logics/TranslateLiveStreamRobot');
const TranslateProductsRobot = require('./logics/TranslateProductsRobot');
const TranslateProductVariationRobot = require('./logics/translateProductVariationRobot');
const TranslateVariationRobot = require('./logics/TranslateVariationRobot');

const robots = [
  // new CancelLiveStreamRobot(),
  new UpdateProductCountRobot(),
  new UpdateStreamCountRobot(),

  new TranslateBrandRobot(),
  new TranslateProductsRobot(),
  new TranslateLiveStreamRobot(),
  new TranslateVariationRobot(),
  new TranslateProductVariationRobot(),
  new ProductHashtagRobot(),
  new LiveStreamVideoTagRobot(),
];
function startRobots() {
  robots.forEach((robot) => {
    setTimeout(() => {
      robot.start();
    }, 5000);    
  });
}

module.exports = {
  startRobots,
};
