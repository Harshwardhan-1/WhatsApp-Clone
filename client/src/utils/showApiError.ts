import type { AxiosError } from "axios";
import Swal from "sweetalert2";

export const showApiError=(err:unknown)=>{
    const error=err as AxiosError;
    let message='something went wrong';
    if(err=== 'input field is empty'){
        message='input field is empty';
    }
        if(error.response && error.response.data){
            const data=error.response.data as {error:string;errors:string,message:string};
             message=data.errors || data.error || data.message  || message;
             Swal.fire({
            toast: true,
            position: "top-end",
            icon: "error",
            title: message,
            timer: 2000,
            showConfirmButton: false,
            background: "#0f172a",
            color: "#e2e8f0",
             });
        }
}





