import {pbkdf2Sync} from 'node:crypto';

const salt: string = 'dnakjuqwhkfnwsncihifqkfq';

export default function generatePassword(pwd:string):String{
    const key = pbkdf2Sync(pwd, salt, 100000, 64, 'sha512');
    return key.toString()
}
