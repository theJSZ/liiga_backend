const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database('flipperiliiga2.db')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const path = require('path')

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

const midBeginsAt = 1985 // was 1985
const newBeginsAt = 1995 // was 1995

// return all events featuring given machine
//
// kisa        nimi
// ----------  ----------
// 2010-1      Huone 105
// 2010-3      Huone 105
// 2010-5      Huone 105

app.get("/events_by_machine", (req, res) => {
    const machine_id = parseInt(req.query.machine_id)
    const sql = `SELECT kisa, L.nimi
                FROM ottelut, lokaatiot L
                WHERE kone_id = ?
                  AND L.id = lokaatio_id
                GROUP BY kisa;`
    db.all(sql, [machine_id], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status: 200, data: rows, success: true})
        })
})

// return nr of entries and wins for given player
// per event
//
// entries     wins        event       location
// ----------  ----------  ----------  ----------
// 12          5           2010-2      Nedi
// 18          11          2010-3      Huone 105
// 13          7           2010-4      Nedi

app.get("/pct_history", (req, res) => {
    const player_id = parseInt(req.query.player_id)
    const sql = `SELECT COUNT(*) as entries,
                (SELECT COUNT(*)
                  FROM ottelut O2
                  WHERE voittaja = ?
                    AND O2.kisa=O.kisa) AS wins,
                kisa AS event,
                L.nimi AS location
                FROM ottelut O, lokaatiot L
                WHERE ? IN (pelaaja1_id, pelaaja2_id)
                AND L.id = O.lokaatio_id
                GROUP BY kisa`
    db.all(sql, [player_id, player_id], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status: 200, data: rows, success: true})
        })
})

// return nr of entries and wins for given player
// on "old" machines
//
// entries     wins
// ----------  ----------
// 195         110

app.get("/old_stats", (req, res) => {
    const player_id = parseInt(req.query.player_id)
    const sql = `SELECT COUNT(*) AS entries,
                (SELECT COUNT(*) FROM ottelut, koneet K
                WHERE voittaja = ?
                  AND kone_id = K.id
                  AND K.valmistusvuosi < ${midBeginsAt}) AS wins
                FROM ottelut, koneet K
                WHERE ? IN (pelaaja1_id, pelaaja2_id)
                  AND kone_id = K.id
                  AND K.valmistusvuosi < ${midBeginsAt};`

    db.all(sql, [player_id, player_id], (err, rows) => {
    if (err) return res.json({status: 300, success: false, error: err})

    return res.json({status: 200, data: rows, success: true})
    })
})

// return nr of entries and wins for given player
// on "mid" machines
//
// entries     wins
// ----------  ----------
// 200         148

app.get("/mid_stats", (req, res) => {
    const player_id = parseInt(req.query.player_id)
    const sql = `SELECT COUNT(*) AS entries,
                (SELECT COUNT(*) FROM ottelut, koneet K
                WHERE voittaja = ?
                  AND kone_id = K.id
                  AND K.valmistusvuosi > ${midBeginsAt-1}
                  AND K.valmistusvuosi < ${newBeginsAt}) AS wins
                FROM ottelut, koneet K
                WHERE ? IN (pelaaja1_id, pelaaja2_id)
                  AND kone_id = K.id
                  AND K.valmistusvuosi > ${midBeginsAt-1}
                  AND K.valmistusvuosi < ${newBeginsAt};`

    db.all(sql, [player_id, player_id], (err, rows) => {
    if (err) return res.json({status: 300, success: false, error: err})

    return res.json({status: 200, data: rows, success: true})
    })
})

// return nr of entries and wins for given player
// on "new" machines
//
// entries     wins
// ----------  ----------
// 331         218

app.get("/new_stats", (req, res) => {
    const player_id = parseInt(req.query.player_id)
    const sql = `SELECT COUNT(*) AS entries,
                (SELECT COUNT(*) FROM ottelut, koneet K
                WHERE voittaja = ?
                  AND kone_id = K.id
                  AND K.valmistusvuosi > ${newBeginsAt-1}) AS wins
                FROM ottelut, koneet K
                WHERE ? IN (pelaaja1_id, pelaaja2_id)
                  AND kone_id = K.id
                  AND K.valmistusvuosi > ${newBeginsAt-1};`

    db.all(sql, [player_id, player_id], (err, rows) => {
    if (err) return res.json({status: 300, success: false, error: err})

    return res.json({status: 200, data: rows, success: true})
    })
})

// return list of all players
//
// id          nimi             tag
// ----------  ---------------  ----------
// 156         Aki Pohjalainen  AKI
// 67          Aki Seuranen     AKI
// 180         Aleksi Ahtila    AL

app.get("/all_players", (req, res) => {
    const sql = "SELECT * FROM pelaajat ORDER BY nimi COLLATE NOCASE"
    db.all(sql, [], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status: 200, data: rows, success: true})
    })
})

// return list of all machines
//
// id          nimi        valmistusvuosi
// ----------  ----------  --------------
// 189         300         1975
// 52          4 Million   1971
// 203         AC/DC       2012

app.get("/all_machines", (req, res) => {
    const sql = "SELECT * FROM koneet ORDER BY nimi COLLATE NOCASE"
    db.all(sql, [], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status: 200, data: rows, success: true})
    })
})

// return player name, id, nr of wins, nr of losses
// for all players on given machine
//
// nimi          id          wins        losses
// ------------  ----------  ----------  ----------
// Aki Seuranen  67          3           4
// Aleksi Ahtil  180         1           0
// Alexander La  135         1           2

app.get("/machine_history_v2", (req, res) => {
    const machine_id = req.query.id
    const sql = `SELECT P.nimi as nimi, P.id,
                (SELECT COUNT(*)
                    FROM ottelut
                    WHERE voittaja = P.id
                    AND kone_id = ?) as wins,
                (SELECT COUNT(*)
                    FROM ottelut
                    WHERE (kone_id = ? AND P.id IN (pelaaja1_id, pelaaja2_id)
                    AND voittaja != P.id)) as losses
                FROM ottelut, pelaajat P
                WHERE (wins + losses > 0)
                GROUP BY P.id
                ORDER BY P.nimi;`

    db.all(sql, [machine_id, machine_id], (err, rows) => {
    if (err) return res.json({status: 300, success: false, error: err})

    return res.json({status: 200, data: rows, success: true})
    })
})

// deprecated
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

// deprecated
app.get(`/matches`, (req, res) => {
    const player_id = req.query.id
    const sql = "SELECT * FROM ottelut WHERE (pelaaja1_id = ? OR pelaaja2_id = ?)"
    db.all(sql, [player_id, player_id], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status: 200, data: rows, success: true})
    })
})

// return name, mfg year, nr of entries, nr of events,
// nr of player one wins, for given machine
//
// nimi           valmistusvuosi  count       appearances  p1_voitot
// -------------  --------------  ----------  -----------  ----------
// Twilight Zone  1993            375         27           197

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

// return nr of matches, appearances, wins, losses
// for given player
//
// matches     appearances  wins        losses
// ----------  -----------  ----------  ----------
// 726         40           476         250

app.get('/n_matches_by_player', (req, res) => {
    const player_id = parseInt(req.query.id)
    const sql = `SELECT COUNT(*) as matches,
                COUNT(DISTINCT kisa) as appearances,
                SUM(voittaja = ?) as wins,
                SUM(voittaja != ?) as losses
                FROM ottelut
                WHERE ? IN (pelaaja1_id, pelaaja2_id);`
    db.all(sql, [player_id, player_id, player_id], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status: 200, data: rows, success: true})
    })
})

// for given player, return list of all players faced by them
// and their win / loss counts
//
// nimi          id          wins        losses
// ------------  ----------  ----------  ----------
// Aki Seuranen  67          7           1
// Alexander La  135         3           0
// Anni Toukkar  25          4           3

app.get('/pvp_history', (req, res) => {
    const player_id = req.query.id
    const sql = `SELECT p.nimi, p.id,
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

// for given player, return a list of all machines they played
// and their win / loss counts
//
// id          nimi        wins        losses
// ----------  ----------  ----------  ----------
// 189         300         1           0
// 52          4 Million   0           1
// 203         AC/DC       8           4

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
                ORDER BY k.nimi
                COLLATE NOCASE;`
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

// return detailed list of all matches played between given two players
//                                                                                    (match id)
// kone        kone_id     voittaja_id  voittaja            haviaja_id  haviaja        id          kisa        lokaatio_id
// ----------  ----------  -----------  ------------------  ----------  -------------  ----------  ----------  -----------
// Banzai Run  32          2            Olli-Mikko Ojamies  6           Jussi Rantala  267         2010-3      1
// Demolition  35          2            Olli-Mikko Ojamies  6           Jussi Rantala  313         2010-4      2
// Joker Poke  18          6            Jussi Rantala       2           Olli-Mikko Oj  559         2010-6      2

app.get('/pair_history', (req, res) => {
    const p1_id = req.query.id1
    const p2_id = req.query.id2

    let sql = `SELECT K.nimi as kone,
                    K.id as kone_id,
                    P.id AS voittaja_id,
                    P.nimi as voittaja,
                    P2.id AS haviaja_id,
                    P2.nimi as haviaja,
                    O.id as id,
                    kisa,
                    lokaatio_id
                FROM ottelut O, koneet K, pelaajat P, pelaajat P2
                WHERE (O.pelaaja1_id IN (P.id, P2.id)
                    AND O.pelaaja2_id IN (P.id, P2.id))
                    AND O.kone_id = K.id
                    AND O.voittaja = P.id
                    AND P.id IN (?, ?)
                    AND P2.id IN (?, ?)
                ORDER BY O.kisa;`

    db.all(sql, [p1_id, p2_id, p1_id, p2_id], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status:200, data: rows, success: true})
    })

})

// return detailed list of all matches played by
// given player on given machine
//
// kone           kone_id     pelaaja1       pelaaja1_id  pelaaja2       pelaaja2_id  kisa        lokaatio_id  ottelu      voittaja_id  voittaja
// -------------  ----------  -------------  -----------  -------------  -----------  ----------  -----------  ----------  -----------  -------------
// Twilight Zone  7           Jussi Rantala  6            Mika Salminen  70           2013-3      5            3251        70           Mika Salminen
// Twilight Zone  7           Joonas Haveri  51           Jussi Rantala  6            2013-5      5            3696        6            Jussi Rantala
// Twilight Zone  7           Pekka Salmia   34           Jussi Rantala  6            2013-5      5            13761       6            Jussi Rantala

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
                lokaatio_id,
                O.id as ottelu,
                voittaja as voittaja_id,
                (SELECT CASE WHEN (P1.id IS voittaja) THEN P1.nimi ELSE P2.nimi END) as voittaja
                FROM ottelut O, koneet K, pelaajat P1, pelaajat P2
                WHERE
                (? IN (pelaaja1_id, pelaaja2_id))
                AND kone_id = K.id
                AND P1.id = pelaaja1_id
                AND P2.id = pelaaja2_id
                AND K.id = ?
                ORDER BY kisa;`

    db.all(sql, [parseInt(player_id), parseInt(machine_id)], (err, rows) => {
        if (err) return res.json({status: 300, success: false, error: err})

        return res.json({status:200, data: rows, success: true})
    })

})

const PORT = process.env.PORT || 3001

// Serve static files from the 'build' directory
// app.use(express.static(path.join(__dirname, 'build')));
// app.use(express.static(path.resolve(__dirname, '..')));


// Define catch-all route to serve index.html
app.get('*', (req, res) => {
    // res.sendFile(path.join(__dirname, 'build', 'index.html'));
    res.sendFile(path.join(__dirname, '..', 'index.html'));

});
console.log(__dirname)

app.listen(PORT, "0.0.0.0", (() =>
console.log(`running on port ${PORT}`)))
