"use client";

import { useEffect, useState } from "react";
import ClaimModal from "@/components/modals/claim-modal";

export const ModalProvider = () => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null;
    }

    return (
        <>
            <ClaimModal />
        </>
    );
};
