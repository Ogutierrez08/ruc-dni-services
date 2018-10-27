const { readFile } = require('fs')

module.exports = {
  /**
   * @param {import("express-serve-static-core").Request} req
   * @param {import("express-serve-static-core").Response} res
   */
  getTestFile: (req, res) => {
    readFile('D:\\mg\\.descargables\\Datos de entrada\\TOTTUS\\output\\436244924-evtah-hist-20258908849-20180702.txt', (err, data) => {
      if (err) return console.log('err', err)

      /* writeFile('./testa.txt', data, (err) => {
        if (err) return console.log('err', err)
      }) */

      res.status(200).send({
        status: '1',
        message: 'OK',
        response: data
      })

      // console.log(Buffer.from(data).toString())
    })
  }
}
