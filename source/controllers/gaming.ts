import { NextFunction, Request, Response } from 'express';
import logging from '../config/logging';
import { User } from '../models/data-model';
import MySQL from '../mysql/executeQuery';

const serverCurrentTimeStamp = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({ timeStamp: new Date().toDateString() });
};

const register = (req: Request, res: Response, next: NextFunction) => {
    if (req.body.name && req.body.name !== '') {
        let user = new User();
        user.name = req.body.name;

        MySQL.executeQuery(
            "INSERT INTO `users`(`name`, `token`, `created_on`, `updated_on`) VALUES ('" + user.name + "', md5(NOW()), current_timestamp(), current_timestamp())",
            function (result: any) {
                console.log('Result from Database :');
                console.log(result);
                if (result.affectedRows && result.affectedRows === 1 && result.insertId && result.insertId !== 0) {
                    console.log(JSON.stringify(result));
                    MySQL.executeQuery('SELECT * FROM users WHERE id=' + result.insertId, function (response: any) {
                        console.log(JSON.stringify(response[0].token));
                        console.log(JSON.parse(JSON.stringify(response)).token);
                        return res.status(200).json({ token: response[0].token });
                    });
                } else {
                    return res.status(200).json('Please try again');
                }
            }
        );
    }
};

const me = (req: Request, res: Response, next: NextFunction) => {
    let temp = req.headers.token?.toString();
    console.log(temp);
    if (req.headers.token) {
        MySQL.executeQuery(
            "SELECT a.id AS user_id, a.name,a.token,b.id AS point_id, SUM(COALESCE(points,0)) AS points,b.started_at FROM `users` a LEFT OUTER JOIN `points` b ON a.id=b.user_id WHERE a.`token`='" +
                temp +
                "'",
            function (result: any) {
                console.log('Result from Database :');
                console.log(result);

                if (result.length !== 0 && result[0].name && result[0].name != undefined && result[0]) {
                    return res.status(200).json({ name: result[0].name, points: result[0].points });
                } else {
                    return res.status(404).json('not found');
                }
            }
        );
    }
};

const gamePlay = (req: Request, res: Response, next: NextFunction) => {
    if (req.body.token) {
        let token = req.body.token;
        MySQL.executeQuery("SELECT * FROM users WHERE token='" + token + "'", function (result: any) {
            console.log('Result from Database :');
            console.log(result);

            if (result.length !== 0 && result[0].id && result[0].id != undefined && result[0]) {
                let query =
                    "SELECT a.id AS user_id,name, SUM(COALESCE(points,0)) AS total, CASE WHEN COUNT(b.id)=5 THEN 'Request again to play' ELSE COUNT(b.id) END AS play FROM `users` a INNER JOIN points b ON a.id=b.user_id WHERE a.id=" +
                    result[0].id +
                    ' AND TIME(b.created_on) BETWEEN TIME(DATE_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)) AND TIME(CURRENT_TIMESTAMP()) AND DATE(b.created_on)=DATE(CURRENT_TIMESTAMP())';
                console.log(query);
                MySQL.executeQuery(query, function (response: any) {
                    console.log('Response from Database :');
                    console.log(response);
                    console.log('----.play');
                    console.log(response.play);
                    console.log('----[RowDataPacket].paly');
                    console.log(response[0].play);
                    if (response.length !== 0 && parseInt(response[0].play) < 5) {
                        MySQL.executeQuery(
                            'INSERT INTO `points`(`user_id`, `points`, `started_at`) VALUES (' +
                                result[0].id +
                                ',(SELECT CASE WHEN (SELECT FLOOR(RAND()*100)+1)< 101 THEN (SELECT FLOOR(RAND()*100)+1) ELSE 10 END),CURRENT_TIMESTAMP())',
                            function (res2: any) {
                                console.log('Repsonse from Database :');
                                console.log(res2);
                                if (res2.affectedRows && res2.affectedRows === 1 && parseInt(res2.insertId) !== 0) {
                                    MySQL.executeQuery('SELECT id,COALESCE(points,0) AS points  FROM points WHERE id=' + res2.insertId, function (res1: any) {
                                        console.log('Result from DataBase :');
                                        console.log(res1);
                                        if (res1[0].length !== 0 && res1[0].id && res1[0].id > 0) {
                                            return res.status(200).json({ name: result[0].name, points: res1[0].points, total: response[0].total });
                                        }
                                    });
                                } else {
                                    return res.status(404).json('not found');
                                }
                            }
                        );
                    } else {
                        console.log('Points are not added to balance');
                        return res.status(404).json('Error');
                    }
                });
            } else {
                return res.status(404).json('not found');
            }
        });
    }
};

const gameClaimBonus = (req: Request, res: Response, next: NextFunction) => {
    if (req.body.token && parseInt(req.body.bonus)) {
        let token = req.body.token;
        MySQL.executeQuery("SELECT * FROM users WHERE token='" + token + "'", function (result: any) {
            console.log('Result from Database :');
            console.log(result);

            if (result.length !== 0 && result[0].id && result[0].id != undefined && result[0]) {
                MySQL.executeQuery(
                    'SELECT a.id AS user_id, b.id AS points_id,a.name,COALESCE(points,0) AS bonus FROM `users` a INNER JOIN points b ON a.id=b.user_id and type="B" AND a.created_on < CURRENT_TIMESTAMP() AND b.started_at < CURRENT_TIMESTAMP() AND a.id=' +
                        result[0].id,
                    function (response: any) {
                        let query = '';
                        if (req.body.bonus >= 10 && req.body.bonus <= 100) {
                            query = 'INSERT INTO `points`(`user_id`, `points`, `type`, `started_at`) VALUES (' + result[0].id + ', ' + parseInt(req.body.bonus) + ",'B',CURRENT_TIMESTAMP())";
                        } else {
                            query = 'INSERT INTO `points`(`user_id`, `points`, `type`, `started_at`) VALUES (' + result[0].id + ", (SELECT FLOOR(RAND()*100)+10),'B',CURRENT_TIMESTAMP())";
                        }
                        MySQL.executeQuery(query, function (r: any) {
                            if (r.affectedRows && r.affectedRows === 1 && r.insertId !== 0) {
                                MySQL.executeQuery('SELECT id AS point_id, points FROM points WHERE id=' + r.insertId, function (r1: any) {
                                    console.log('Result from DataBase :');
                                    console.log();
                                    if (r1.length !== 0 && r1[0].point_id) {
                                        MySQL.executeQuery(
                                            'SELECT a.id AS user_id,name, SUM(COALESCE(points,0)) AS total, CASE WHEN COUNT(b.id)=5 THEN "Request again to play" ELSE COUNT(b.id) END AS play FROM `users` a INNER JOIN points b ON a.id=b.user_id WHERE a.id= ' +
                                                result[0].id,
                                            function (r3: any) {
                                                console.log('Result from DataBase :');
                                                console.log(r3);
                                                if (r3.length !== 0 && r3[0].user_id) {
                                                    res.status(200).json({ name: result[0].name, points: r1[0].points, total: r3[0].total });
                                                } else {
                                                    res.status(404).json('not found');
                                                }
                                            }
                                        );
                                    } else {
                                        return res.status(404).json('Error');
                                    }
                                });
                            }
                        });
                    }
                );
            }
        });
    }
};

const leaderBoard = (req: Request, res: Response, next: NextFunction) => {
    if (req.headers.token) {
        MySQL.executeQuery(
            "SELECT a.id AS user_id, a.name,a.token,b.id AS point_id, SUM(COALESCE(points,0)) AS points,b.started_at FROM `users` a LEFT OUTER JOIN `points` b ON a.id=b.user_id WHERE a.`token`='" +
                req.headers.token.toString() +
                "'",
            function (result: any) {
                console.log('Result from Database :');
                console.log(result);

                if (result.length !== 0 && result[0].name && result[0].name != undefined && result[0]) {
                    MySQL.executeQuery(
                        'SELECT a.id ,name, SUM(COALESCE(points,0)) AS total, @s:=@s+1 palce FROM `users` a INNER JOIN points b ON b.user_id=a.id, (SELECT @s:= 0) AS s GROUP BY a.id ORDER BY SUM(COALESCE(points,0)) DESC,@S limit 0,10',
                        function (response: any) {
                            if (response.length !== 0) {
                                return res.status(200).json(JSON.stringify(response));
                            }
                        }
                    );
                } else {
                    return res.status(404).json('not found');
                }
            }
        );
    } else {
        res.status(404).json('not found');
    }
};
export default { serverCurrentTimeStamp, register, me, gamePlay, gameClaimBonus, leaderBoard };
