import axios from 'axios';
import qs from 'qs';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';

const jar = new CookieJar();
const client = wrapper(axios.create({ jar }));

export async function login() {
    const loginURL = "https://adfslight.edukacja.gorzow.pl/LoginPage.aspx";
    
    const formData = {
        Username: process.env.Username,
        Password: process.env.Password
    };

    try {
        const response = await client.post(
            loginURL,
            qs.stringify(formData),
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                maxRedirects: 0,
                validateStatus: (status) => status < 400,
            }
        );
        console.log("Login response status: ", response.status);
        console.log("Cookies set: ", jar.getCookiesSync(loginURL));
    } catch (err) {
        console.error(err.response?.status, err.response?.headers);
    }
}