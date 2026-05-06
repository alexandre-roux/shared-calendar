import {useEffect, useState} from "react";

export function useIsMobile() {
    const [isMobile, setIsMobile] = useState(window.innerWidth < 720);

    useEffect(() => {
        function handleResize() {
            setIsMobile(window.innerWidth < 720);
        }

        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return isMobile;
}