import axios from "axios";

export const api = axios.create({
    baseURL: "https://gocomet-backend-pratyaksh10016605-hbawhdpe.leapcell.dev",
    headers: {
        "Content-Type": "application/json",
    },
});
