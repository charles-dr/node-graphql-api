/**
 * @description merge the website db from app db.
 * @param {*} req 
 * @member {string array} tables
 * @param {*} res 
 */
const path = require('path');
const axios = require('axios');
const { Validator } = require('node-input-validator');

const repository = require(path.resolve('src/repository'));
const logger = require(path.resolve('config/logger'));
const discordWebhook = 'https://discord.com/api/webhooks/...';
const srcUrl = "http://IP_ADDRESS:4000";

const activity = {
  notify2Discord: ({ message, title, description }) => {
    return axios.post(discordWebhook, {
      "username": "Shoclef Live",
      "content": message,
      "embeds": [
        {
          "color": 51678,
          "fields": [
            {
              "name": title,
              "value": description,
              "inline": true
            },
          ],
        },
      ],
    });
  },
  getSrcTotal: (table) => {
    return axios({
      baseURL: srcUrl,
      url: `/rest/total-rows/${table}`,
      method: 'get',
    }).then(({ data }) => data.total)
    .catch((error) => error.response.data.total);
  },
  loadSrcData: (table, skip, limit) => {
    return axios({
      baseURL: srcUrl,
      url: '/rest/paginate-data',
      method: 'post',
      data: { table, skip, limit },
    }).then(({ data }) => data.data)
    .catch((e) => []);
  },
  mergeTable: async (table) => {
    const batch = 200;
    try {
      if (!repository[table]) throw new Error(`Invalid table name: "${table}"`);
      const repo = repository[table];
      const model = repo.model;
      const total = await activity.getSrcTotal(table);
      console.log(`[Sync][Total][${table}] ${total} rows`);
      // await activity.notify2Discord({ message: 'test', title: table, description: 'got total rows' });

      const nIter = Math.ceil(total / batch);
      let inserted = 0;
      for (let i = 0; i < nIter; i++) {
        await activity.loadSrcData(table, i * batch, batch).then((rows) => Promise.all(rows.map((row) => {
          return model.findOne({ _id: row._id }).then((exists) => {
            if (exists) return exists;
            const document = new model(row);
            inserted ++;
            return document.save();            
          }).catch((e) => console.log('[Insert Error]', e));
        })));
        logger.info(`[Sync][${table}] ${i * batch}-${(i + 1) * batch}`);
      }
      await activity.notify2Discord({
        message: 'success',
        title: table,
        description: `Synced ${total} documents. Inserted ${inserted} rows.`,
      });
    } catch (e) {
      console.log(`[Sync][${table}]`, e)
      await activity.notify2Discord({
        message: 'error',
        title: table,
        description: e.message,
      });
    }
  },
}

module.exports = async (req, res) => {
  const niv = new Validator(req.body, {
    tables: "required",
  });

  const { tables } = req.body;
  return niv.check().then((matched) => {
    if (!matched) throw niv.errors[0];
  }).then(async () => {
    for (let i = 0; i < tables.length; i++) {
      await activity.mergeTable(tables[i]);
    }
    return res.json({
      status: true,
      message: 'success',
      tables,
    })
  })
  .catch((error) => {
    console.log('[Sync][Error]', error);
    return res.json({ status: false, message: error.message });
  });
}
