const request = require('request')
const uris = require('./../utils/uris')

module.exports = {
  /**
   * @param {import("express-serve-static-core").Request} req
   * @param {import("express-serve-static-core").Response} res
   */
  getRucData (req, res) {
    const ruc = req.body.ruc ? req.body.ruc : ''

    if (ruc === '') {
      res.status(412).send({ status: '0', message: 'Fields [ruc] are mandatories' })
      return
    }

    request.get(uris.URL_GET_RUC_DATA(ruc), { json: true }, (error, response, body) => {
      if (error) {
        res.status(503).send({
          status: '-1',
          message: `Error getting ruc data for ${ruc}`
        })
        return
      }

      res.status(200).send({ status: '1', message: 'Ok', rucData: body })
    })
  }
}
