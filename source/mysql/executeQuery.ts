import { Connection } from 'mysql';
import config from './config';
import * as MySql from 'mysql';

function executeQuery(query: string, callback: any) {
    try {
        let connection = MySql.createConnection(config);
        connection.connect((err) => {
            if (err) {
                console.log(err);
                console.error('error connecting: ' + err);
                return;
            }
        });

        connection.query(query, function (err, result) {
            if (err) {
                console.log('Error from query execution :');
                console.log(err);
                return callback(err);
            } else {
                console.log(result);
                return callback(result);
            }
        });

        connection.end();
    } catch (err) {
        console.log(err);
        throw err;
    }
}

export default {
    executeQuery
};

//SELECT * FROM users WHERE token='ae42c8dd3baa3141ee6e9d7dd5bc30c0'
// executeQuery('SELECT * FROM users', (result: any) => {
//     console.log('Result from Db :');
//     console.log(result);
// });
