_N_E=(window.webpackJsonp_N_E=window.webpackJsonp_N_E||[]).push([[19],{IyL3:function(t,e,r){(window.__NEXT_P=window.__NEXT_P||[]).push(["/status",function(){return r("bOUk")}])},bOUk:function(t,e,r){"use strict";r.r(e),r.d(e,"default",(function(){return D}));var s=r("vJKn"),a=r.n(s),n=r("rg98"),c=r("xvhg"),o=r("MX0m"),u=r.n(o),d=r("q1tI"),i=r.n(d),p=r("wDBh"),l=r("Eg+e"),x=r("Bl7J"),f=r("85Sb"),S=r("rJ65"),v=r("3DnH"),g=i.a.createElement;function A(t,e){return parseFloat(p.ethers.utils.formatUnits(t,e))}function h(t){return A(t,18)}function y(t){return A(t,8)}function m(t){return A(t,6)}function b(t){return t.map?t.map((function(t){return b(t)})).reduce((function(t,e){return[t," ",e]})):t.toString().startsWith("0x")?g("a",{href:"https://snowtrace.io/address/".concat(t),target:"blank",key:t},t):t}function U(t,e){return g(i.a.Fragment,null,g("thead",{className:"jsx-320853969"},g("tr",{className:"jsx-320853969"},g("th",{className:"jsx-320853969 header-text"},t),g("th",{className:"jsx-320853969"}))),g("tbody",{className:"jsx-320853969"},Object.entries(e).map((function(t){var e=Object(c.a)(t,2),r=e[0],s=e[1];return g("tr",{key:r,className:"jsx-320853969"},g("td",{className:"jsx-320853969"},r),g("td",{className:"jsx-320853969"},s&&b(s)))}))),g(u.a,{id:"320853969"},[".header-text.jsx-320853969{font-size:1.2rem;padding-top:23px;padding-bottom:10px;}"]))}function D(t){var e=t.locale,r=t.onLocale,s=Object(l.b)(v.a,(function(t){return t.network})),c=Object(l.b)(v.a,(function(t){return t.contracts})),o=c.usdt,p=c.dai,b=c.usdc,D=c.usdc_native,j=c.vault,k=c.xusd,O=Object(d.useState)({}),w=O[0],C=O[1],T=Object(d.useState)({}),P=T[0],H=T[1],_=Object(d.useState)({}),B=_[0],E=_[1],F=Object(d.useState)({}),N=F[0],V=F[1],X=Object(d.useState)({}),I=X[0],L=X[1],R=Object(d.useState)({}),G=R[0],q=R[1],J=Object(d.useState)({}),W=J[0],z=J[1],K=Object(d.useState)({}),M=K[0],Q=K[1],Y=Object(d.useState)({}),Z=Y[0],$=Y[1],tt=Object(d.useState)({}),et=tt[0],rt=tt[1],st=Object(d.useState)({}),at=st[0],nt=st[1],ct=Object(d.useState)({}),ot=ct[0],ut=ct[1],dt=Object(d.useState)({}),it=dt[0],pt=dt[1];return Object(d.useEffect)((function(){s&&function(){var t=Object(n.a)(a.a.mark((function t(){return a.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.t0=C,t.t1=s.XUSDProxy.address,t.next=5,s.XUSDProxy.implementation();case 5:return t.t2=t.sent,t.t3=s.XUSD.__originalAddress,t.t4=s.VaultProxy.address,t.next=10,s.VaultProxy.implementation();case 10:return t.t5=t.sent,t.t6=s.Vault.__originalAddress,t.t7=s.VaultCore.address,t.t8=s.VaultAdmin.address,t.t9=s.OracleRouter.address,t.t10=s.Governor.address,t.t11=s.AaveStrategyProxy.address,t.next=19,s.AaveStrategyProxy.implementation();case 19:return t.t12=t.sent,t.t13=s.AaveStrategy.__originalAddress,t.t14=s.CurveUsdcStrategyProxy.address,t.next=24,s.CurveUsdcStrategyProxy.implementation();case 24:return t.t15=t.sent,t.t16=s.CurveUsdcStrategy.__originalAddress,t.t17=s.AlphaHomoraStrategyProxy.address,t.next=29,s.AlphaHomoraStrategyProxy.implementation();case 29:t.t18=t.sent,t.t19=s.AlphaHomoraStrategy.__originalAddress,t.t20={"XUSD proxy":t.t1,"XUSD impl":t.t2,XUSD:t.t3,"Vault proxy":t.t4,"Vault impl":t.t5,Vault:t.t6,VaultCore:t.t7,VaultAdmin:t.t8,OracleRouter:t.t9,Governor:t.t10,"AaveStrategy proxy":t.t11,"AaveStrategy impl":t.t12,AaveStrategy:t.t13,"CurveUsdcStrategy proxy":t.t14,"CurveUsdcStrategy impl":t.t15,CurveUsdcStrategy:t.t16,"AlphaHomoraStrategy proxy":t.t17,"AlphaHomoraStrategy impl":t.t18,AlphaHomoraStrategy:t.t19},(0,t.t0)(t.t20),t.next=38;break;case 35:t.prev=35,t.t21=t.catch(0),console.error(t.t21);case 38:case"end":return t.stop()}}),t,null,[[0,35]])})));return function(){return t.apply(this,arguments)}}()()}),[s]),Object(d.useEffect)((function(){s&&function(){var t=Object(n.a)(a.a.mark((function t(){return a.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.t0=H,t.next=4,s.Governor.admin();case 4:return t.t1=t.sent,t.next=7,s.Governor.pendingAdmin();case 7:return t.t2=t.sent,t.next=10,s.Governor.delay();case 10:return t.t3=t.sent.toString(),t.next=13,s.Governor.proposalCount();case 13:t.t4=t.sent.toString(),t.t5={Admin:t.t1,"Pending Admin":t.t2,"Delay (seconds)":t.t3,"Proposal Count":t.t4},(0,t.t0)(t.t5),t.next=21;break;case 18:t.prev=18,t.t6=t.catch(0),console.error(t.t6);case 21:case"end":return t.stop()}}),t,null,[[0,18]])})));return function(){return t.apply(this,arguments)}}()()}),[s]),Object(d.useEffect)((function(){s&&function(){var t=Object(n.a)(a.a.mark((function t(){return a.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.t0=E,t.next=4,s.XUSDProxy.governor();case 4:return t.t1=t.sent,t.next=7,s.VaultProxy.governor();case 7:return t.t2=t.sent,t.next=10,s.AaveStrategyProxy.governor();case 10:return t.t3=t.sent,t.next=13,s.AlphaHomoraStrategyProxy.governor();case 13:return t.t4=t.sent,t.next=16,s.CurveUsdcStrategyProxy.governor();case 16:t.t5=t.sent,t.t6={XUSD:t.t1,Vault:t.t2,AaveStrategy:t.t3,AlphaHomoraStrategy:t.t4,CurveUsdcStrategy:t.t5},(0,t.t0)(t.t6),t.next=24;break;case 21:t.prev=21,t.t7=t.catch(0),console.error(t.t7);case 24:case"end":return t.stop()}}),t,null,[[0,21]])})));return function(){return t.apply(this,arguments)}}()()}),[s]),Object(d.useEffect)((function(){k&&function(){var t=Object(n.a)(a.a.mark((function t(){var e,r,s;return a.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,k.totalSupply();case 3:return e=t.sent,t.next=6,k.nonRebasingSupply();case 6:return r=t.sent,s=e.sub(r),t.t0=V,t.next=11,k.name();case 11:return t.t1=t.sent,t.next=14,k.symbol();case 14:return t.t2=t.sent,t.next=17,k.decimals();case 17:return t.t3=t.sent,t.t4=h(e),t.next=21,k.vaultAddress();case 21:return t.t5=t.sent,t.t6=h(r),t.t7=h(s),t.t8=h,t.next=27,k.rebasingCreditsPerToken();case 27:return t.t9=t.sent,t.t10=(0,t.t8)(t.t9),t.t11=h,t.next=32,k.rebasingCredits();case 32:t.t12=t.sent,t.t13=(0,t.t11)(t.t12),t.t14={name:t.t1,symbol:t.t2,decimals:t.t3,totalSupply:t.t4,vaultAddress:t.t5,nonRebasingSupply:t.t6,rebasingSupply:t.t7,rebasingCreditsPerToken:t.t10,rebasingCredits:t.t13},(0,t.t0)(t.t14),t.next=41;break;case 38:t.prev=38,t.t15=t.catch(0),console.error(t.t15);case 41:case"end":return t.stop()}}),t,null,[[0,38]])})));return function(){return t.apply(this,arguments)}}()()}),[k]),Object(d.useEffect)((function(){s&&function(){var t=Object(n.a)(a.a.mark((function t(){return a.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.t0=L,t.t1=y,t.next=5,s.OracleRouter.price(p.address);case 5:return t.t2=t.sent,t.t3=(0,t.t1)(t.t2),t.t4=y,t.next=10,s.OracleRouter.price(o.address);case 10:return t.t5=t.sent,t.t6=(0,t.t4)(t.t5),t.t7=y,t.next=15,s.OracleRouter.price(b.address);case 15:return t.t8=t.sent,t.t9=(0,t.t7)(t.t8),t.t10=y,t.next=20,s.OracleRouter.price(D.address);case 20:t.t11=t.sent,t.t12=(0,t.t10)(t.t11),t.t13={"DAI.e":t.t3,"USDT.e":t.t6,"USDC.e":t.t9,USDC:t.t12},(0,t.t0)(t.t13),t.next=29;break;case 26:t.prev=26,t.t14=t.catch(0),console.error(t.t14);case 29:case"end":return t.stop()}}),t,null,[[0,26]])})));return function(){return t.apply(this,arguments)}}()()}),[s,p,b,D,o]),Object(d.useEffect)((function(){j&&function(){var t=Object(n.a)(a.a.mark((function t(){var e,r,s;return a.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.t0=h,t.next=4,j.vaultBuffer();case 4:return t.t1=t.sent,e=(0,t.t0)(t.t1),t.next=8,j.redeemFeeBps();case 8:return r=t.sent,t.next=11,j.trusteeFeeBps();case 11:return s=t.sent,t.t2=q,t.next=15,j.rebasePaused();case 15:return t.t3=t.sent.toString(),t.next=18,j.capitalPaused();case 18:return t.t4=t.sent.toString(),t.t5="".concat(r," (").concat(r/100,"%)"),t.t6="".concat(s," (").concat(s/100,"%)"),t.t7="".concat(e," (").concat(100*e,"%)"),t.t8=h,t.next=25,j.autoAllocateThreshold();case 25:return t.t9=t.sent,t.t10=(0,t.t8)(t.t9),t.t11=h,t.next=30,j.rebaseThreshold();case 30:return t.t12=t.sent,t.t13=(0,t.t11)(t.t12),t.t14=A,t.next=35,j.maxSupplyDiff();case 35:return t.t15=t.sent,t.t16=(0,t.t14)(t.t15,16),t.next=39,j.priceProvider();case 39:return t.t17=t.sent,t.next=42,j.uniswapAddr();case 42:return t.t18=t.sent,t.next=45,j.getStrategyCount();case 45:return t.t19=t.sent.toString(),t.next=48,j.getAssetCount();case 48:return t.t20=t.sent.toString(),t.next=51,j.strategistAddr();case 51:return t.t21=t.sent,t.next=54,j.trusteeAddress();case 54:t.t22=t.sent,t.t23={rebasePaused:t.t3,capitalPaused:t.t4,redeemFeeBps:t.t5,trusteeFeeBps:t.t6,vaultBuffer:t.t7,"autoAllocateThreshold (USD)":t.t10,"rebaseThreshold (USD)":t.t13,maxSupplyDiff:t.t16,"Price provider address":t.t17,"Uniswap address":t.t18,"Strategy count":t.t19,"Asset count":t.t20,"Strategist address":t.t21,"Trustee address":t.t22},(0,t.t2)(t.t23),t.next=62;break;case 59:t.prev=59,t.t24=t.catch(0),console.error(t.t24);case 62:case"end":return t.stop()}}),t,null,[[0,59]])})));return function(){return t.apply(this,arguments)}}()()}),[j]),Object(d.useEffect)((function(){j&&function(){var t=Object(n.a)(a.a.mark((function t(){return a.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.t0=z,t.t1=h,t.next=5,j.totalValue();case 5:return t.t2=t.sent,t.t3=(0,t.t1)(t.t2).toFixed(2),t.t4=h,t.next=10,j.checkBalance(p.address);case 10:return t.t5=t.sent,t.t6=(0,t.t4)(t.t5).toFixed(2),t.t7=m,t.next=15,j.checkBalance(o.address);case 15:return t.t8=t.sent,t.t9=(0,t.t7)(t.t8).toFixed(2),t.t10=m,t.next=20,j.checkBalance(b.address);case 20:return t.t11=t.sent,t.t12=(0,t.t10)(t.t11).toFixed(2),t.t13=m,t.next=25,j.checkBalance(D.address);case 25:t.t14=t.sent,t.t15=(0,t.t13)(t.t14).toFixed(2),t.t16={"totalValue (USD)":t.t3,"DAI.e":t.t6,"USDT.e":t.t9,"USDC.e":t.t12,USDC:t.t15},(0,t.t0)(t.t16),t.next=34;break;case 31:t.prev=31,t.t17=t.catch(0),console.error(t.t17);case 34:case"end":return t.stop()}}),t,null,[[0,31]])})));return function(){return t.apply(this,arguments)}}()()}),[j,p,b,D,o]),Object(d.useEffect)((function(){j&&function(){var t=Object(n.a)(a.a.mark((function t(){return a.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.t0=Q,t.t1=h,t.next=5,p.balanceOf(j.address);case 5:return t.t2=t.sent,t.t3=(0,t.t1)(t.t2).toFixed(2),t.t4=m,t.next=10,o.balanceOf(j.address);case 10:return t.t5=t.sent,t.t6=(0,t.t4)(t.t5).toFixed(2),t.t7=m,t.next=15,b.balanceOf(j.address);case 15:return t.t8=t.sent,t.t9=(0,t.t7)(t.t8).toFixed(2),t.t10=m,t.next=20,D.balanceOf(j.address);case 20:t.t11=t.sent,t.t12=(0,t.t10)(t.t11).toFixed(2),t.t13={"DAI.e":t.t3,"USDT.e":t.t6,"USDC.e":t.t9,USDC:t.t12},(0,t.t0)(t.t13),t.next=29;break;case 26:t.prev=26,t.t14=t.catch(0),console.error(t.t14);case 29:case"end":return t.stop()}}),t,null,[[0,26]])})));return function(){return t.apply(this,arguments)}}()()}),[j,p,b,D,o]),Object(d.useEffect)((function(){s&&function(){var t=Object(n.a)(a.a.mark((function t(){return a.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.t0=$,t.t1=h,t.next=5,s.AaveStrategy.checkBalance(p.address);case 5:return t.t2=t.sent,t.t3=(0,t.t1)(t.t2),t.t4=m,t.next=10,s.AaveStrategy.checkBalance(o.address);case 10:return t.t5=t.sent,t.t6=(0,t.t4)(t.t5),t.t7=m,t.next=15,s.AaveStrategy.checkBalance(b.address);case 15:return t.t8=t.sent,t.t9=(0,t.t7)(t.t8),t.t10=m,t.next=20,s.AlphaHomoraStrategy.checkBalance(p.address);case 20:return t.t11=t.sent,t.t12=(0,t.t10)(t.t11),t.t13=m,t.next=25,s.AlphaHomoraStrategy.checkBalance(o.address);case 25:return t.t14=t.sent,t.t15=(0,t.t13)(t.t14),t.t16=m,t.next=30,s.AlphaHomoraStrategy.checkBalance(b.address);case 30:return t.t17=t.sent,t.t18=(0,t.t16)(t.t17),t.t19=m,t.next=35,s.CurveUsdcStrategy.checkBalance(b.address);case 35:return t.t20=t.sent,t.t21=(0,t.t19)(t.t20),t.t22=m,t.next=40,s.CurveUsdcStrategy.checkBalance(D.address);case 40:t.t23=t.sent,t.t24=(0,t.t22)(t.t23),t.t25={"Aave avDAI.e":t.t3,"Aave avUSDT.e":t.t6,"Aave avUSDC.e":t.t9,"Alpha Homora DAI.e":t.t12,"Alpha Homora USDT.e":t.t15,"Alpha Homora USDC.e":t.t18,"Curve USDC.e":t.t21,"Curve USDC":t.t24},(0,t.t0)(t.t25),t.next=49;break;case 46:t.prev=46,t.t26=t.catch(0),console.error(t.t26);case 49:case"end":return t.stop()}}),t,null,[[0,46]])})));return function(){return t.apply(this,arguments)}}()()}),[s,p,b,D,o]),Object(d.useEffect)((function(){j&&function(){var t=Object(n.a)(a.a.mark((function t(){return a.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.t0=rt,t.next=4,j.assetDefaultStrategies(p.address);case 4:return t.t1=t.sent,t.next=7,j.assetDefaultStrategies(o.address);case 7:return t.t2=t.sent,t.next=10,j.assetDefaultStrategies(b.address);case 10:return t.t3=t.sent,t.next=13,j.assetDefaultStrategies(D.address);case 13:t.t4=t.sent,t.t5={"DAI.e":t.t1,"USDT.e":t.t2,"USDC.e":t.t3,USDC:t.t4},(0,t.t0)(t.t5),t.next=21;break;case 18:t.prev=18,t.t6=t.catch(0),console.error(t.t6);case 21:case"end":return t.stop()}}),t,null,[[0,18]])})));return function(){return t.apply(this,arguments)}}()()}),[j,p,b,D,o]),Object(d.useEffect)((function(){s&&function(){var t=Object(n.a)(a.a.mark((function t(){return a.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.t0=nt,t.next=4,s.AaveStrategy.vaultAddress();case 4:return t.t1=t.sent,t.next=7,s.AaveStrategy.platformAddress();case 7:return t.t2=t.sent,t.next=10,s.AaveStrategy.getRewardTokenAddresses();case 10:return t.t3=t.sent,t.next=13,s.AaveStrategy.rewardLiquidationThreshold();case 13:return t.t4=t.sent.toString(),t.next=16,s.AaveStrategy.supportsAsset(p.address);case 16:return t.t5=t.sent.toString(),t.next=19,s.AaveStrategy.supportsAsset(o.address);case 19:return t.t6=t.sent.toString(),t.next=22,s.AaveStrategy.supportsAsset(b.address);case 22:return t.t7=t.sent.toString(),t.next=25,s.AaveStrategy.supportsAsset(D.address);case 25:t.t8=t.sent.toString(),t.t9={vaultAddress:t.t1,platformAddress:t.t2,rewardTokenAddresses:t.t3,rewardLiquidationThreshold:t.t4,"supportsAsset(DAI.e)":t.t5,"supportsAsset(USDT.e)":t.t6,"supportsAsset(USDC.e)":t.t7,"supportsAsset(USDC)":t.t8},(0,t.t0)(t.t9),t.next=33;break;case 30:t.prev=30,t.t10=t.catch(0),console.error(t.t10);case 33:case"end":return t.stop()}}),t,null,[[0,30]])})));return function(){return t.apply(this,arguments)}}()()}),[s,p,b,D,o]),Object(d.useEffect)((function(){s&&function(){var t=Object(n.a)(a.a.mark((function t(){return a.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.t0=ut,t.next=4,s.CurveUsdcStrategy.vaultAddress();case 4:return t.t1=t.sent,t.next=7,s.CurveUsdcStrategy.platformAddress();case 7:return t.t2=t.sent,t.next=10,s.CurveUsdcStrategy.getRewardTokenAddresses();case 10:return t.t3=t.sent,t.next=13,s.CurveUsdcStrategy.rewardLiquidationThreshold();case 13:return t.t4=t.sent.toString(),t.next=16,s.CurveUsdcStrategy.supportsAsset(p.address);case 16:return t.t5=t.sent.toString(),t.next=19,s.CurveUsdcStrategy.supportsAsset(o.address);case 19:return t.t6=t.sent.toString(),t.next=22,s.CurveUsdcStrategy.supportsAsset(b.address);case 22:return t.t7=t.sent.toString(),t.next=25,s.CurveUsdcStrategy.supportsAsset(D.address);case 25:t.t8=t.sent.toString(),t.t9={vaultAddress:t.t1,platformAddress:t.t2,rewardTokenAddresses:t.t3,rewardLiquidationThreshold:t.t4,"supportsAsset(DAI.e)":t.t5,"supportsAsset(USDT.e)":t.t6,"supportsAsset(USDC.e)":t.t7,"supportsAsset(USDC)":t.t8},(0,t.t0)(t.t9),t.next=33;break;case 30:t.prev=30,t.t10=t.catch(0),console.error(t.t10);case 33:case"end":return t.stop()}}),t,null,[[0,30]])})));return function(){return t.apply(this,arguments)}}()()}),[s,p,b,D,o]),Object(d.useEffect)((function(){s&&function(){var t=Object(n.a)(a.a.mark((function t(){return a.a.wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.t0=pt,t.next=4,s.AlphaHomoraStrategy.vaultAddress();case 4:return t.t1=t.sent,t.next=7,s.AlphaHomoraStrategy.platformAddress();case 7:return t.t2=t.sent,t.next=10,s.AlphaHomoraStrategy.getRewardTokenAddresses();case 10:return t.t3=t.sent,t.next=13,s.AlphaHomoraStrategy.rewardLiquidationThreshold();case 13:return t.t4=t.sent.toString(),t.next=16,s.AlphaHomoraStrategy.supportsAsset(p.address);case 16:return t.t5=t.sent.toString(),t.next=19,s.AlphaHomoraStrategy.supportsAsset(o.address);case 19:return t.t6=t.sent.toString(),t.next=22,s.AlphaHomoraStrategy.supportsAsset(b.address);case 22:return t.t7=t.sent.toString(),t.next=25,s.AlphaHomoraStrategy.supportsAsset(D.address);case 25:t.t8=t.sent.toString(),t.t9={vaultAddress:t.t1,platformAddress:t.t2,rewardTokenAddresses:t.t3,rewardLiquidationThreshold:t.t4,"supportsAsset(DAI.e)":t.t5,"supportsAsset(USDT.e)":t.t6,"supportsAsset(USDC.e)":t.t7,"supportsAsset(USDC)":t.t8},(0,t.t0)(t.t9),t.next=33;break;case 30:t.prev=30,t.t10=t.catch(0),console.error(t.t10);case 33:case"end":return t.stop()}}),t,null,[[0,30]])})));return function(){return t.apply(this,arguments)}}()()}),[s,p,b,D,o]),g(i.a.Fragment,null,g(x.a,{locale:e,onLocale:r,dapp:!0},g(f.a,{dapp:!0,page:"status",locale:e,onLocale:r}),g("div",{className:"jsx-3102044739 d-flex flex-column p-0 pt-md-3"},g(S.a,null),g("div",{className:"jsx-3102044739 status-table"},g("h4",{style:{padding:"0.75rem",fontWeight:"bold"},className:"jsx-3102044739"},"Factor XUSD network status: \ud83d\udfe2"),g("table",{className:"jsx-3102044739 table table-right"},U("Strategy balances",Z),U("Vault balances",W),U("Vault buffer balances",M),U("Vault settings",G),U("Contract addresses",w),U("Oracle prices",I),U("Default strategies",et),U("Aave avToken strategy",at),U("Alpha Homora strategy",it),U("Curve USDC/USDC.e strategy",ot),U("XUSD",N),U("Governor",P),U("Governor addresses",B))))),g(u.a,{id:"3102044739"},[".status-table.jsx-3102044739{min-height:470px;height:100%;padding:20px;border-radius:0 0 10px 10px;border-top:solid 1px #cdd7e0;background-color:#fafbfc;}"]))}}},[["IyL3",0,1,4,5,2,3,6]]]);