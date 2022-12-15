const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('flipperiliiga.db')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')

let sql;
sql = 'SELECT nimi FROM pelaajat'

// db.all(sql, [], (err, rows) => {
//     if (err) return console.error(err.message)
//     rows.forEach(row => {
//         console.log(row.nimi)
//     })
// })

app.use(bodyParser.json())
app.use(cors())

app.get("/all_players", (req, res) => {
    const sql = "SELECT * FROM pelaajat ORDER BY nimi"
    db.all(sql, [], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status: 200, data: rows, success: true})
    })
})

app.get(`/machine_history_all`, (req, res) => {
    const machine_id = req.query.machine_id
    const sql = `SELECT O.id as ottelu,
                P.nimi as pelaaja1,
                P2.nimi as pelaaja2,
                O.kisa,
                (SELECT CASE WHEN (P.id IS voittaja)
                  THEN P.nimi
                  ELSE P2.nimi END) as voittaja,
                (SELECT COUNT(*)
                  FROM ottelut where voittaja=pelaaja1_id AND kone_id = ?) as p1_voitot
                FROM ottelut O, pelaajat P, pelaajat P2
                WHERE O.kone_id = ?
                AND P.id = O.pelaaja1_id
                AND P2.id = O.pelaaja2_id;

    `
    db.all(sql, [machine_id, machine_id], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status: 200, data: rows, success: true})
    })
})

app.get(`/matches`, (req, res) => {
    const player_id = req.query.id
    const sql = "SELECT * FROM ottelut WHERE (pelaaja1_id = ? OR pelaaja2_id = ?)"
    db.all(sql, [player_id, player_id], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status: 200, data: rows, success: true})
    })
})

app.get(`/machine_stats`, (req, res) => {
    const machine_id = req.query.id
    const sql = `SELECT nimi,
                valmistusvuosi,
                COUNT(*) as count,
                COUNT(DISTINCT kisa) as appearances,
                SUM(pelaaja1_id = voittaja) as p1_voitot
                FROM ottelut, koneet K
                WHERE kone_id = ? AND
                K.id = kone_id;`
    db.all(sql, [machine_id], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status: 200, data: rows, success: true})
    })
})

app.get('/n_matches_by_player', (req, res) => {
    const player_id = req.query.id
    const sql = `SELECT
                (SELECT COUNT(*)
                FROM ottelut
                WHERE (pelaaja1_id = ? OR pelaaja2_id = ?)
                AND voittaja != ?)
                AS losses,
                (SELECT COUNT(*)
                FROM ottelut
                WHERE voittaja = ?)
                AS wins`
    db.all(sql, [player_id, player_id, player_id, player_id], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status: 200, data: rows, success: true})
    })
})



app.get('/pvp_history', (req, res) => {
    const player_id = req.query.id
    const sql = `SELECT p.nimi,
                (SELECT COUNT(*) FROM ottelut WHERE voittaja = ?
                AND (pelaaja1_id = P.id OR pelaaja2_id = P.id)) AS wins,
                (SELECT COUNT(*) FROM ottelut WHERE voittaja = P.id
                AND (pelaaja1_id = ? OR pelaaja2_id = ?)) AS losses
                FROM ottelut, pelaajat P WHERE P.id != ?
                AND (wins > 0 or losses > 0)
                GROUP BY P.id
                ORDER BY P.nimi;`
    db.all(sql, [player_id, player_id, player_id, player_id], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status:200, data: rows, success: true})
    })
})

app.get('/machine_history', (req, res) => {
    const player_id = req.query.id
    const sql = `SELECT k.id, k.nimi,
                (SELECT COUNT(*) FROM ottelut WHERE voittaja = ?
                AND kone_id = k.id) AS wins,
                (SELECT COUNT(*) FROM ottelut WHERE voittaja != ?
                AND (pelaaja1_id = ? OR pelaaja2_id = ?)
                AND kone_id = k.id) AS losses
                FROM ottelut, koneet k
                WHERE (wins > 0 OR losses > 0)
                GROUP BY k.id
                ORDER BY k.nimi;`
    db.all(sql, [player_id, player_id, player_id, player_id], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status:200, data: rows, success: true})
    })
})

app.get('/single_player_by_name', (req, res) => {
    const player_name = req.query.name
    const sql = `SELECT *
                FROM pelaajat
                WHERE nimi = ?`
    db.all(sql, [player_name], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status:200, data: rows, success: true})
    })
})

app.get('/single_machine_by_id', (req, res) => {
    const machine_id = req.query.id
    const sql = `SELECT *
                FROM koneet
                WHERE id = ?`
    db.all(sql, [machine_id], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status:200, data: rows, success: true})
    })
})

app.get('/pair_history', (req, res) => {
    const p1_id = req.query.id1
    const p2_id = req.query.id2

    let sql = `SELECT K.nimi as kone,
                    K.id as kone_id,
                    P.id AS voittaja_id,
                    P.nimi as voittaja,
                    P2.id AS haviaja_id,
                    P2.nimi as haviaja,
                    kisa
                FROM ottelut O, koneet K, pelaajat P, pelaajat P2
                WHERE (O.pelaaja1_id IN (P.id, P2.id)
                    AND O.pelaaja2_id IN (P.id, P2.id))
                    AND O.kone_id = K.id
                    AND O.voittaja = P.id
                    AND P.id IN (?, ?)
                    AND P2.id IN (?, ?)
                ORDER BY voittaja DESC;`

    db.all(sql, [p1_id, p2_id, p1_id, p2_id], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status:200, data: rows, success: true})
    })

})

app.get('/player_machine_history', (req, res) => {
    const player_id = req.query.player_id
    const machine_id = req.query.machine_id

    const sql = `SELECT
                K.nimi as kone,
                K.id as kone_id,
                P1.nimi as pelaaja1,
                pelaaja1_id,
                P2.nimi as pelaaja2,
                pelaaja2_id,
                kisa,
                O.id as ottelu,
                voittaja as voittaja_id,
                (SELECT CASE WHEN (P1.id IS voittaja) THEN P1.nimi ELSE P2.nimi END) as voittaja
                FROM ottelut O, koneet K, pelaajat P1, pelaajat P2
                WHERE
                (? IN (pelaaja1_id, pelaaja2_id))
                AND kone_id = K.id
                AND P1.id = pelaaja1_id
                AND P2.id = pelaaja2_id
                AND K.id = ?;`

    db.all(sql, [parseInt(player_id), parseInt(machine_id)], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status:200, data: rows, success: true})
    })

})

const PORT = process.env.PORT || 3001
app.listen(PORT, "0.0.0.0", (() =>
console.log(`running on port ${PORT}`)))
