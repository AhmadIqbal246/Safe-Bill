import React from 'react';
import OnBoardingComp from '../components/RegisterComponents/SellerReg/OnBoardingComp';
import SafeBillHeader from '../components/mutualComponents/Navbar/Navbar';

export default function OnBoardingPage() {
    return(
        <div>
            <SafeBillHeader/>
            <OnBoardingComp/>
        </div>
    );
}
