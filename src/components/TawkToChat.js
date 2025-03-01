"use client";

import { useEffect } from 'react';

export default function TawkToChat() {
  useEffect(() => {
    // Tawk.to initialization script
    var Tawk_API = Tawk_API || {};
    var Tawk_LoadStart = new Date();
    
    (function(){
      var s1 = document.createElement("script"),s0=document.getElementsByTagName("script")[0];
      var s0 = document.getElementsByTagName("script")[0];
      s1.async = true;
      s1.src = 'https://embed.tawk.to/67c301c52506f9190d4e43a5/1il8rtr56'; // You'll need to replace this with your Tawk.to ID
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');
      s0.parentNode.insertBefore(s1, s0);
    })();

    // Customize the widget appearance
    Tawk_API.onLoad = function() {
      Tawk_API.setAttributes({
        'theme': 'dark',
        'backgroundColor': '#1F2937', // gray-800
        'actionButtonColor': '#F97316', // orange-500
        'bubbleColor': '#F97316',
        'bubbleBackgroundColor': '#1F2937',
        'maximizedBorderRadius': '16px',
        'minimizedBorderRadius': '16px'
      }, function(error) {});
    };

    // Clean up on component unmount
    return () => {
      if (window.Tawk_API && window.Tawk_API.endChat) {
        window.Tawk_API.endChat();
      }
    };
  }, []);

  return null; // Component doesn't render anything directly
} 