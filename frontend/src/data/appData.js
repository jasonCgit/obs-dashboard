// Centralized application data — single source of truth for Applications page + global filter
// Data sourced from AWM application portfolio spreadsheet
export const APPS = [
  // ── Asset Management (Product Line 964: Client) ──
  { name: 'PANDA', seal: '35115', team: 'Client Data', sla: '99.9%', incidents: 1, last: '2d ago',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Gitanjali Nistala', cbt: 'Karthik Rajagopalan', appOwner: 'Debasish Majhi',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Client', product: 'Client Data', deploymentTypes: ['gap', 'gkp'] },
  { name: 'Morgan Money', seal: '16649', team: 'Client Data', sla: '99.9%', incidents: 8, last: '25m ago',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Jon Glennie', cbt: 'Kalpesh Narkhede', appOwner: 'Dilip Bhanderi',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Client', product: 'Morgan Money', deploymentTypes: ['gap', 'gkp', 'ecs'] },

  // ── Asset Management (Product Line 528: Cross AM) ──
  { name: 'Spectrum UI', seal: '90556', team: 'Spectrum Core', sla: '99.5%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Sheetal Gandhi', cbt: 'Alex Feinberg', appOwner: 'Alex Feinberg',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Cross AM', product: 'Spectrum Core', deploymentTypes: ['gap', 'gkp'] },

  // ── Asset Management (Product Line 965: Global Liquidity Portfolio Management) ──
  { name: 'Spectrum Trading Money Markets', seal: '106195', team: 'Liquidity Mgmt', sla: '99.5%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Jon Glennie', cbt: 'Safina Siddiqui', appOwner: 'Safina Siddiqui',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Global Liquidity Portfolio Management', product: 'Spectrum Trading Money Markets', deploymentTypes: ['gap'] },

  // ── Asset Management (Product Line 365: Investor) ──
  { name: 'Quantum', seal: '91001', team: 'JPMAIM Platform', sla: '99.9%', incidents: 1, last: '3d ago',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Alec Hamby', cbt: 'Michael Hasing', appOwner: 'Michael Hasing',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Investor', product: 'JPMAIM Platform', deploymentTypes: ['gap', 'gkp'] },
  { name: 'Spectrum Portfolio Management (Equities)', seal: '90215', team: 'Portfolio Mgmt', sla: '99.5%', incidents: 1, last: '1d ago',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Lakith Leelasena', cbt: 'Aadi Thayyar', appOwner: 'Kai Shen',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Investor', product: 'Portfolio Management', deploymentTypes: ['gap', 'gkp'],
    deployments: [
      { id: '64958',  label: 'Spectrum PI - Equities Deployment' },
      { id: '103262', label: 'Spectrum PI - Equities - Deployment' },
      { id: '109606', label: 'Spectrum PI - Equities PSF' },
      { id: '110724', label: 'Spectrum PI - Equities GKP Config Server' },
      { id: '112256', label: 'Spectrum PI - Equities Dep 5' },
    ] },
  { name: 'AM PMT Routing Service', seal: '107517', team: 'Portfolio Mgmt', sla: '99.0%', incidents: 3, last: '4h ago',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Lakith Leelasena', cbt: 'Ashvin Venkatraman', appOwner: 'Richard Song',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Investor', product: 'Portfolio Management', deploymentTypes: ['gap'] },
  { name: 'PRISM - IM', seal: '34210', team: 'Portfolio Mgmt', sla: '99.5%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Lakith Leelasena', cbt: 'Josh Ludmer', appOwner: 'Ritu Vyas',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Investor', product: 'Portfolio Management', deploymentTypes: ['gap', 'gkp'] },
  { name: 'ES2', seal: '106127', team: 'Portfolio Mgmt', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Lakith Leelasena', cbt: 'Josh Ludmer', appOwner: 'Smitha Rajasenan',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Investor', product: 'Portfolio Management', deploymentTypes: ['gap'] },
  { name: 'Info Hub and Data Oversight', seal: '25705', team: 'Portfolio Mgmt', sla: '99.5%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Lakith Leelasena', cbt: 'Josh Ludmer', appOwner: 'Sushant Tadvalkar',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Investor', product: 'Portfolio Management', deploymentTypes: ['gap', 'gkp'] },
  { name: 'Spectrum Portfolio Management Multi-Asset', seal: '90645', team: 'Portfolio Mgmt', sla: '99.5%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Lakith Leelasena', cbt: 'Kent Zheng', appOwner: 'Kelly Silva',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Investor', product: 'Portfolio Management', deploymentTypes: ['gap', 'gkp'] },
  { name: 'SPECTRA', seal: '85333', team: 'Portfolio Mgmt', sla: '99.5%', incidents: 1, last: '3d ago',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Lakith Leelasena', cbt: 'Kent Zheng', appOwner: 'Kiran Kadiyala',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Investor', product: 'Portfolio Management', deploymentTypes: ['gap'] },
  { name: 'JEDI - J.P. Morgan ETF Data Intelligence', seal: '85589', team: 'Portfolio Mgmt', sla: '99.9%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Lakith Leelasena', cbt: 'Kent Zheng', appOwner: 'Kiran Kadiyala',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Investor', product: 'Portfolio Management', deploymentTypes: ['gap', 'gkp', 'ecs'] },
  { name: 'GM-Solutions-BMT-Research-HB-Desktop', seal: '86525', team: 'Portfolio Mgmt', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Lakith Leelasena', cbt: 'Kent Zheng', appOwner: 'Saurabh Pawse',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Investor', product: 'Portfolio Management', deploymentTypes: ['gap'] },
  { name: 'Center Trading', seal: '87082', team: 'Trading', sla: '99.5%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Lakith Leelasena', cbt: 'Ashvin Venkatraman', appOwner: 'Arat Sharda',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Investor', product: 'Trading', deploymentTypes: ['gap', 'gkp'] },
  { name: 'Spectrum Trading', seal: '35206', team: 'Trading', sla: '99.5%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Lakith Leelasena', cbt: 'Ashvin Venkatraman', appOwner: 'Graeme Walker',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Investor', product: 'Trading', deploymentTypes: ['gap', 'gkp'] },
  { name: 'Order Decision Engine', seal: '81884', team: 'Trading', sla: '99.9%', incidents: 1, last: '2d ago',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Lakith Leelasena', cbt: 'Ashvin Venkatraman', appOwner: 'Jonathan Hendie',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Maintain', rto: '4',
    productLine: 'Investor', product: 'Trading', deploymentTypes: ['gap', 'gkp', 'ecs'] },

  // ── Asset Management (Product Line 366: Operations) ──
  { name: 'CMA', seal: '23419', team: 'Middle Office', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Sheetal Gandhi', cbt: 'Alison Hickey', appOwner: 'Jigar Dattani',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Operations', product: 'AM Middle Office', deploymentTypes: ['gap'] },
  { name: 'Collateral Management', seal: '31894', team: 'Middle Office', sla: '99.0%', incidents: 1, last: '2d ago',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Sheetal Gandhi', cbt: 'Alison Hickey', appOwner: 'Andrew Love',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Maintain', rto: '4',
    productLine: 'Operations', product: 'AM Middle Office', deploymentTypes: ['gap'] },
  { name: 'Ops Party', seal: '16367', team: 'Transaction Mgmt', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Sheetal Gandhi', cbt: 'Alison Hickey', appOwner: 'Andrew Love',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Operations', product: 'AM Transaction Management', deploymentTypes: ['gap'] },
  { name: 'Salerio', seal: '79946', team: 'Transaction Mgmt', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Sheetal Gandhi', cbt: 'Alison Hickey', appOwner: 'Anoop Soni',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Maintain', rto: '4',
    productLine: 'Operations', product: 'AM Transaction Management', deploymentTypes: ['gap', 'gkp'] },
  { name: 'TPR Netting', seal: '31572', team: 'Transaction Mgmt', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Sheetal Gandhi', cbt: 'Alison Hickey', appOwner: 'Libin Baby Malayildan',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Maintain', rto: '4',
    productLine: 'Operations', product: 'AM Transaction Management', deploymentTypes: ['gap'] },
  { name: 'Custody Messaging', seal: '20082', team: 'Transaction Mgmt', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Sheetal Gandhi', cbt: 'Alison Hickey', appOwner: 'Pradeep Uderani',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Operations', product: 'AM Transaction Management', deploymentTypes: ['gap'] },
  { name: 'OneSentinel', seal: '89614', team: 'Guidelines', sla: '99.0%', incidents: 1, last: '2d ago',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Sheetal Gandhi', cbt: 'Pradeep Uderani', appOwner: 'Pradeep Uderani',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Operations', product: 'Guidelines', deploymentTypes: ['gap', 'gkp'] },
  { name: 'Acey-Eagle STARI', seal: '25557', team: 'Investment Acctg', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Enrique Smith', cbt: 'Richard Tyburski', appOwner: 'Priya Sharma',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Operations', product: 'Investment Accounting - Position Service', deploymentTypes: ['gap'] },
  { name: 'Spectrum Book of Records', seal: '105111', team: 'Investment Acctg', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Enrique Smith', cbt: 'Richard Tyburski', appOwner: 'Priya Sharma',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Operations', product: 'Investment Accounting - Position Service', deploymentTypes: ['gap', 'gkp'] },
  { name: 'PODS - Positions ODS', seal: '36176', team: 'Investment Acctg', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Asset Management', cto: 'Enrique Smith', cbt: 'Thatha Desigan Thirumalai Sangapuram', appOwner: 'Ravi Shankar',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Operations', product: 'Investment Accounting - Position Service', deploymentTypes: ['gap'] },

  // ── AWM Shared (Product Lines 1004, 1005) ──
  { name: 'CD: Lite - Asset Data Distribution', seal: '33528', team: 'Ref Data', sla: '99.5%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'AWM Shared', cto: 'Michael Heizer', cbt: 'Nidhi Verma', appOwner: 'Kavita Kumari Gupta',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'AWM Chief Data Office', product: 'Securities Reference Data', deploymentTypes: ['gap', 'gkp'] },
  { name: 'AWM Entitlements aka WEAVE', seal: '102987', team: 'Tech Shared Svc', sla: '99.9%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'AWM Shared', cto: 'Joe Pedone', cbt: 'Daniel Bieler', appOwner: 'Chad Thomas',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Tech Shared Services', product: 'A&E - AWM Entitlements and Visibility', deploymentTypes: ['gap', 'gkp', 'ecs'] },

  // ── Global Private Bank (Product Line 367: Advisor, Client, and Servicing) ──
  { name: 'Connect OS', seal: '88180', team: 'Connect Platform', sla: '99.9%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Rod Thomas', cbt: 'Arun Tummalapalli', appOwner: 'Albina Patel',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Advisor, Client, and Servicing', product: 'Connect Platform', deploymentTypes: ['aws', 'gap'],
    deployments: [
      { id: '112224', label: 'Connect OS Critical Applications and Services AWS - Global (xSwiss)' },
      { id: '111848', label: 'Connect OS Mobile AWS - Global' },
      { id: '110175', label: 'Connect OS Internet Facing Applications and Services Gaia Cloud Foundry - NA' },
      { id: '103719', label: 'Connect OS Legacy Infrastructure - NA' },
      { id: '103720', label: 'Connect Desktop - DEV' },
      { id: '103721', label: 'Connect Desktop - UAT' },
      { id: '103722', label: 'Connect Desktop - PROD' },
      { id: '103723', label: 'Connect Desktop - Global Link' },
      { id: '104739', label: 'Connect OS WordPress CMS Gaia Cloud Foundry - NA' },
      { id: '108750', label: 'Connect OS AI Machine Learning' },
      { id: '109718', label: 'Connect OS Critical Applications and Services Gaia Cloud Foundry - Global' },
      { id: '109719', label: 'Connect OS Mobile Gaia Cloud Foundry - Global' },
      { id: '109720', label: 'Connect OS Non-Critical Applications and Services Gaia Cloud Foundry - Global' },
      { id: '109739', label: 'Connect OS Swiss Applications and Services Gaia Cloud Foundry - SwissNet' },
      { id: '111835', label: 'Connect OS Gaia Oracle Services - Global' },
      { id: '111836', label: 'Connect OS User Metrics Elastic/Cassandra - Global' },
      { id: '61867',  label: 'Connect OS Legacy Infrastructure - Asia' },
      { id: '61868',  label: 'Connect OS Legacy Infrastructure - EMEA' },
    ] },
  { name: 'Advisor Connect', seal: '90176', team: 'Connect Platform', sla: '99.9%', incidents: 3, last: '2h ago',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Rod Thomas', cbt: 'Arun Tummalapalli', appOwner: 'Albina Patel',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Advisor, Client, and Servicing', product: 'Connect Platform', deploymentTypes: ['aws'],
    deployments: [
      { id: '109974', label: 'Advisor Connect Suite - NA - AWS' },
      { id: '112169', label: 'ADVISOR CONNECT AWS - NA' },
      { id: '102024', label: 'ADVISOR CONNECT - EMEA' },
      { id: '102025', label: 'ADVISOR CONNECT - Asia' },
      { id: '102026', label: 'ADVISOR CONNECT - US' },
      { id: '104948', label: 'JPMS Advisor Connect Deployment' },
      { id: '109355', label: 'ADVISOR CONNECT - Swiss AWS' },
      { id: '62056',  label: 'Tool for Reaching and Acquiring Clients (TRAC)' },
      { id: '114650', label: 'ADVISOR CONNECT AWS - AP' },
      { id: '115060', label: 'ADVISOR CONNECT AWS - EU' },
    ] },
  { name: 'Meridian Batch Platform', seal: '84540', team: 'Party & Account', sla: '99.5%', incidents: 1, last: '1d ago',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Rod Thomas', cbt: 'Arun Tummalapalli', appOwner: 'Joe Peluso III',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Advisor, Client, and Servicing', product: 'Global Party and Account Data', deploymentTypes: ['gap'] },
  { name: 'Meridian Data Services Platform', seal: '106003', team: 'Party & Account', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Rod Thomas', cbt: 'Kshipra Sahajpal', appOwner: 'Ravindranath Gnanaiah',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Advisor, Client, and Servicing', product: 'Global Party and Account Data', deploymentTypes: ['gap', 'gkp'] },
  { name: 'PAM: GWM Party and Account Maintenance', seal: '85003', team: 'Party & Account', sla: '99.9%', incidents: 1, last: '2d ago',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Rod Thomas', cbt: 'Kshipra Sahajpal', appOwner: 'Ravindranath Gnanaiah',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Advisor, Client, and Servicing', product: 'Global Party and Account Management', deploymentTypes: ['gap', 'gkp'] },
  { name: 'RDIO', seal: '83278', team: 'Portfolio Holdings', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Rod Thomas', cbt: 'Eddie Hsu', appOwner: 'Varghese George',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Advisor, Client, and Servicing', product: 'Global Portfolio Holdings', deploymentTypes: ['gap'] },
  { name: 'Service Connect', seal: '89749', team: 'Service Desktop', sla: '99.5%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Stephen Musacchia', cbt: 'Pranit Pan', appOwner: 'Naveen Kolhapalli',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Advisor, Client, and Servicing', product: 'Global Service Desktop & Coach', deploymentTypes: ['gap', 'gkp'] },
  { name: 'Client Service Case Management', seal: '88652', team: 'Service Desktop', sla: '99.5%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Stephen Musacchia', cbt: 'Pranit Pan', appOwner: 'Vinit Patel',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Advisor, Client, and Servicing', product: 'Global Service Desktop & Coach', deploymentTypes: ['gap'] },
  { name: 'IPB Payments', seal: '110787', team: 'IPB Banking', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Mark Napier', cbt: 'Jyoti', appOwner: 'Shilak Chatterjee',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Advisor, Client, and Servicing', product: 'IPB Banking & Payments', deploymentTypes: ['gap'] },
  { name: 'IPB Brokerage', seal: '110143', team: 'IPB Execute', sla: '99.0%', incidents: 1, last: '2d ago',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Mark Napier', cbt: 'John Langley', appOwner: 'Pratibha Dolli',
    cpof: 'Yes', riskRanking: 'High', classification: 'Third Party Internal', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Advisor, Client, and Servicing', product: 'IPB Execute (Brokerage)', deploymentTypes: ['gkp'] },
  { name: 'Murex', seal: '22703', team: 'IPB Execute', sla: '99.9%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Mark Napier', cbt: 'John Langley', appOwner: 'Ankit Srivastav',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '2',
    productLine: 'Advisor, Client, and Servicing', product: 'IPB Execute (Brokerage)', deploymentTypes: ['gap', 'gkp'] },
  { name: 'Payment Connect', seal: '85928', team: 'PBA Payments', sla: '99.5%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Stephen Musacchia', cbt: 'Pranit Pan', appOwner: 'Sunil Kumar',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Advisor, Client, and Servicing', product: 'PBA Payments', deploymentTypes: ['gap'] },
  { name: 'Brokerage Connect Trading', seal: '90500', team: 'US Brokerage', sla: '99.5%', incidents: 1, last: '2d ago',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Rod Thomas', cbt: 'Navi Sirisena', appOwner: 'Doug Anestad',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Advisor, Client, and Servicing', product: 'US Brokerage Advisor & Client Experience', deploymentTypes: ['gap', 'gkp'] },
  { name: 'Global Security Transfer', seal: '102419', team: 'Asset Transfers', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Stephen Musacchia', cbt: 'Pranit Pan', appOwner: 'Biju Nangelimalli',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Advisor, Client, and Servicing', product: 'Asset Transfers', deploymentTypes: ['gap'] },

  // ── Global Private Bank (Product Line 368: Operations, Utilities, and Core Data) ──
  { name: 'IBM Content Manager OnDemand', seal: '18506', team: 'Content', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Mark Napier', cbt: 'Marcus Rose', appOwner: 'Kunal Jayakar',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Maintain', rto: '4',
    productLine: 'Operations, Utilities, and Core Data', product: 'Content Capabilities', deploymentTypes: ['gap'] },
  { name: 'OLYMPIC', seal: '10340', team: 'IPB Core Banking', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Mark Napier', cbt: 'Marcus Rose', appOwner: 'Marcus Rose',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Operations, Utilities, and Core Data', product: 'IPB Accounting: IPB Core Banking-Olympic', deploymentTypes: ['gap', 'gkp'] },
  { name: 'WM Swift Middleware', seal: '84065', team: 'IPB Core Banking', sla: '99.0%', incidents: 1, last: '3d ago',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Rod Thomas', cbt: 'Navi Sirisena', appOwner: 'Mikhavlo Kramarenko',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Operations, Utilities, and Core Data', product: 'IPB Accounting: IPB Core Banking-Olympic', deploymentTypes: ['gap'] },
  { name: 'Global Funds Maintenance', seal: '83756', team: 'Mutual Funds', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Rod Thomas', cbt: 'Navi Sirisena', appOwner: 'Saurabh Shankar',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Operations, Utilities, and Core Data', product: 'Mutual Funds and Money Markets', deploymentTypes: ['gap'] },
  { name: 'PBIS', seal: '10720', team: 'Core Accounting', sla: '99.0%', incidents: 1, last: '3d ago',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Stephen Musacchia', cbt: 'James Lee', appOwner: 'Ted Devvoody',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Operations, Utilities, and Core Data', product: 'USPB Core Accounting and Statements', deploymentTypes: ['gap'] },
  { name: 'OMNI Core Accounting (OMNITRUST)', seal: '17175', team: 'Core Accounting', sla: '99.9%', incidents: 1, last: '3d ago',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Stephen Musacchia', cbt: 'Ricky Amin', appOwner: 'Ted Devvoody',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Operations, Utilities, and Core Data', product: 'USPB Core Accounting and Statements', deploymentTypes: ['gap', 'gkp'] },
  { name: 'WM Task Management', seal: '85233', team: 'Work Orchestration', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Stephen Musacchia', cbt: 'Ricky Amin', appOwner: 'Meghal Parikh',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Maintain', rto: '4',
    productLine: 'Operations, Utilities, and Core Data', product: 'Work Orchestration and Automation', deploymentTypes: ['gap'] },

  // ── Global Private Bank (Product Line 369: Solutions) ──
  { name: 'ROME - CORE', seal: '80453', team: 'Cross Asset Trading', sla: '99.5%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Rod Thomas', cbt: 'Navi Sirisena', appOwner: 'Indy Ahluwalia',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Maintain', rto: '4',
    productLine: 'Solutions', product: 'Global Cross Asset Trading (Flow)', deploymentTypes: ['gap', 'gkp'] },
  { name: 'GWM Global Collateral Management', seal: '90083', team: 'Lending', sla: '99.5%', incidents: 1, last: '1d ago',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Stephen Musacchia', cbt: 'Indy Ahluwalia', appOwner: 'Nilanjana Mukherjee',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Solutions', product: 'Lending', deploymentTypes: ['gap'] },
  { name: 'PB Loan Origination System', seal: '34387', team: 'Mortgages', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Vrinda Menon', cbt: 'Albert Naclerio', appOwner: 'Scott Johnson',
    cpof: 'Yes', riskRanking: 'High', classification: 'Third Party Internal', state: 'Operate', investmentStrategy: 'Maintain', rto: '4',
    productLine: 'Solutions', product: 'Mortgages', deploymentTypes: ['gkp'] },
  { name: 'GSTP 2.0', seal: '110850', team: 'Portfolio Impl', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Kamesh Karra', cbt: 'Elavasaran Shanmugam', appOwner: 'Rishesh B Prabhakar',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Solutions', product: 'Portfolio Implementation', deploymentTypes: ['gap', 'gkp'] },
  { name: 'Discretionary Investments - Charles River', seal: '103290', team: 'Portfolio Impl', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Kamesh Karra', cbt: 'Shawn Allavadhi', appOwner: 'John Parker',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Solutions', product: 'Portfolio Implementation', deploymentTypes: ['gap'] },
  { name: 'DNV Trading Middleware', seal: '84412', team: 'Portfolio Impl', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Rod Thomas', cbt: 'Navi Sirisena', appOwner: 'Alan Donnelly',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Maintain', rto: '4',
    productLine: 'Solutions', product: 'Portfolio Implementation', deploymentTypes: ['gap', 'gkp'] },
  { name: 'WM Hibiscus', seal: '86626', team: 'PM Toolkit', sla: '99.0%', incidents: 0, last: '—',
    lob: 'AWM', subLob: 'Global Private Bank', cto: 'Rafael Forte', cbt: 'Tony Wu', appOwner: 'Kelu Gu',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Solutions', product: 'Portfolio Manager Toolkit & Due Diligence', deploymentTypes: ['gap'] },

  // ── CCB (Consumer & Community Banking) ──
  { name: 'Chase Mobile Banking Platform', seal: '45210', team: 'Mobile Engineering', sla: '99.99%', incidents: 1, last: '2d ago',
    lob: 'CCB', subLob: '', cto: 'Michael Torres', cbt: 'Sarah Kim', appOwner: 'David Martinez',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '1',
    productLine: 'Digital Banking', product: 'Mobile Banking', deploymentTypes: ['gkp', 'ecs'] },
  { name: 'Consumer Lending Gateway', seal: '45320', team: 'Lending Platform', sla: '99.9%', incidents: 1, last: '3d ago',
    lob: 'CCB', subLob: '', cto: 'Michael Torres', cbt: 'Sarah Kim', appOwner: 'Jennifer Walsh',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Consumer Lending', product: 'Lending Platform', deploymentTypes: ['gap', 'gkp'] },
  { name: 'Retail Branch Operations', seal: '45115', team: 'Branch Tech', sla: '99.5%', incidents: 0, last: '—',
    lob: 'CCB', subLob: '', cto: 'Michael Torres', cbt: 'Robert Nguyen', appOwner: 'Amanda Foster',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Maintain', rto: '4',
    productLine: 'Branch Services', product: 'Branch Operations', deploymentTypes: ['gap'] },
  { name: 'Credit Card Processing Engine', seal: '45440', team: 'Cards Platform', sla: '99.99%', incidents: 3, last: '3h ago',
    lob: 'CCB', subLob: '', cto: 'Michael Torres', cbt: 'Robert Nguyen', appOwner: 'Carlos Mendez',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '1',
    productLine: 'Cards & Payments', product: 'Card Processing', deploymentTypes: ['gap', 'gkp', 'ecs'] },

  // ── CDAO (Chief Data & Analytics Office) ──
  { name: 'Enterprise Data Lake', seal: '52100', team: 'Data Platform', sla: '99.5%', incidents: 0, last: '—',
    lob: 'CDAO', subLob: '', cto: 'David Chen', cbt: 'Priya Patel', appOwner: 'Wei Zhang',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Data Infrastructure', product: 'Data Lake', deploymentTypes: ['gkp', 'eks'] },
  { name: 'Analytics Workbench', seal: '52215', team: 'Analytics Eng', sla: '99.0%', incidents: 0, last: '—',
    lob: 'CDAO', subLob: '', cto: 'David Chen', cbt: 'Priya Patel', appOwner: 'Maria Gonzalez',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '8',
    productLine: 'Analytics', product: 'Self-Service Analytics', deploymentTypes: ['gkp'] },
  { name: 'Data Quality Hub', seal: '52330', team: 'Data Governance', sla: '99.0%', incidents: 0, last: '—',
    lob: 'CDAO', subLob: '', cto: 'David Chen', cbt: 'Nadia Hussain', appOwner: 'Timothy Brooks',
    cpof: 'Yes', riskRanking: 'Medium', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '8',
    productLine: 'Data Governance', product: 'Data Quality', deploymentTypes: ['gap', 'gkp'] },

  // ── CIB — Markets ──
  { name: 'Trade Execution Engine', seal: '60100', team: 'Electronic Trading', sla: '99.9%', incidents: 3, last: '2h ago',
    lob: 'CIB', subLob: 'Markets', cto: 'Joe Pedone', cbt: 'Marcus Wong', appOwner: 'Brian Callahan',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '1',
    productLine: 'Electronic Trading', product: 'Trade Execution', deploymentTypes: ['gap', 'gkp', 'ecs'] },
  { name: 'FX Trading Platform', seal: '60215', team: 'FX Technology', sla: '99.9%', incidents: 1, last: '1d ago',
    lob: 'CIB', subLob: 'Markets', cto: 'Joe Pedone', cbt: 'Marcus Wong', appOwner: 'Yuki Tanaka',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '1',
    productLine: 'FX & Rates', product: 'FX Trading', deploymentTypes: ['gap', 'gkp'] },

  // ── CIB — Global Banking ──
  { name: 'Loan Syndication Platform', seal: '61100', team: 'Syndicated Lending', sla: '99.5%', incidents: 0, last: '—',
    lob: 'CIB', subLob: 'Global Banking', cto: 'Jennifer Liu', cbt: 'Robert Patel', appOwner: 'Michelle Chen',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Lending', product: 'Syndicated Lending', deploymentTypes: ['gap', 'gkp'] },
  { name: 'Corporate Treasury Portal', seal: '61220', team: 'Treasury Tech', sla: '99.5%', incidents: 0, last: '—',
    lob: 'CIB', subLob: 'Global Banking', cto: 'Jennifer Liu', cbt: 'Robert Patel', appOwner: 'Stephen Hart',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Treasury Services', product: 'Corporate Treasury', deploymentTypes: ['gap'] },

  // ── CIB — Payments ──
  { name: 'Real-Time Payments Gateway', seal: '62100', team: 'Payments Core', sla: '99.99%', incidents: 6, last: '20m ago',
    lob: 'CIB', subLob: 'Payments', cto: 'Joe Pedone', cbt: 'Alex Rivera', appOwner: 'Raj Krishnan',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '1',
    productLine: 'Payment Processing', product: 'Real-Time Payments', deploymentTypes: ['gap', 'gkp', 'ecs'] },
  { name: 'Cross-Border Payments Engine', seal: '62215', team: 'International Pmts', sla: '99.9%', incidents: 1, last: '2d ago',
    lob: 'CIB', subLob: 'Payments', cto: 'Joe Pedone', cbt: 'Alex Rivera', appOwner: 'Elena Popova',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '2',
    productLine: 'Payment Processing', product: 'Cross-Border Payments', deploymentTypes: ['gap', 'gkp'] },

  // ── CIB — Digital Platform and Services ──
  { name: 'CIB Digital Onboarding', seal: '63100', team: 'Digital Platform', sla: '99.5%', incidents: 0, last: '—',
    lob: 'CIB', subLob: 'Digital Platform and Services', cto: 'Jennifer Liu', cbt: 'Samantha Park', appOwner: 'Kevin Byrne',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '4',
    productLine: 'Client Onboarding', product: 'Digital Onboarding', deploymentTypes: ['gkp', 'ecs'] },
  { name: 'API Developer Portal', seal: '63220', team: 'API Platform', sla: '99.5%', incidents: 0, last: '—',
    lob: 'CIB', subLob: 'Digital Platform and Services', cto: 'Jennifer Liu', cbt: 'Samantha Park', appOwner: 'Nathan Ross',
    cpof: 'Yes', riskRanking: 'Medium', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '8',
    productLine: 'Developer Services', product: 'API Portal', deploymentTypes: ['gkp', 'ecs'] },

  // ── CT (Corporate Technology) ──
  { name: 'Identity Access Management', seal: '70100', team: 'IAM Engineering', sla: '99.99%', incidents: 0, last: '—',
    lob: 'CT', subLob: '', cto: 'Thomas Anderson', cbt: 'Nicole Chen', appOwner: 'Patricia Williams',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '1',
    productLine: 'Security', product: 'Identity & Access', deploymentTypes: ['gap', 'gkp'] },
  { name: 'Enterprise Monitoring Platform', seal: '70215', team: 'Observability', sla: '99.9%', incidents: 2, last: '6h ago',
    lob: 'CT', subLob: '', cto: 'Thomas Anderson', cbt: 'Nicole Chen', appOwner: 'Ryan Cooper',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '2',
    productLine: 'Observability', product: 'Monitoring', deploymentTypes: ['gkp', 'eks'] },
  { name: 'Cloud Infrastructure Manager', seal: '70330', team: 'Cloud Eng', sla: '99.9%', incidents: 1, last: '3d ago',
    lob: 'CT', subLob: '', cto: 'Thomas Anderson', cbt: 'Derek Johnson', appOwner: 'Lisa Huang',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '2',
    productLine: 'Cloud Platform', product: 'Infrastructure Management', deploymentTypes: ['gkp', 'eks'] },
  { name: 'Service Mesh Gateway', seal: '70440', team: 'Network Eng', sla: '99.9%', incidents: 0, last: '—',
    lob: 'CT', subLob: '', cto: 'Thomas Anderson', cbt: 'Derek Johnson', appOwner: 'Ahmed Hassan',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '2',
    productLine: 'Network Services', product: 'Service Mesh', deploymentTypes: ['gkp'] },

  // ── EP (Employee Platform) ──
  { name: 'HR Self-Service Portal', seal: '75100', team: 'HR Technology', sla: '99.5%', incidents: 0, last: '—',
    lob: 'EP', subLob: '', cto: 'Lisa Zhang', cbt: 'James Williams', appOwner: 'Sandra Miller',
    cpof: 'No', riskRanking: 'Medium', classification: 'Third Party Internal', state: 'Operate', investmentStrategy: 'Maintain', rto: '8',
    productLine: 'HR Services', product: 'Employee Self-Service', deploymentTypes: ['gap'] },
  { name: 'Learning Management System', seal: '75215', team: 'L&D Technology', sla: '99.0%', incidents: 0, last: '—',
    lob: 'EP', subLob: '', cto: 'Lisa Zhang', cbt: 'James Williams', appOwner: 'Christine Park',
    cpof: 'No', riskRanking: 'Low', classification: 'Third Party Internal', state: 'Operate', investmentStrategy: 'Maintain', rto: '24',
    productLine: 'Learning & Development', product: 'LMS', deploymentTypes: ['gap'] },

  // ── IP (Infrastructure Platforms) ──
  { name: 'Container Orchestration Platform', seal: '80100', team: 'Container Eng', sla: '99.99%', incidents: 0, last: '—',
    lob: 'IP', subLob: '', cto: 'Kumar Raghavan', cbt: 'Patrick Murphy', appOwner: 'Diana Rodriguez',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '1',
    productLine: 'Container Platform', product: 'Orchestration', deploymentTypes: ['gkp', 'eks'] },
  { name: 'Network Automation Suite', seal: '80215', team: 'Network Automation', sla: '99.9%', incidents: 0, last: '—',
    lob: 'IP', subLob: '', cto: 'Kumar Raghavan', cbt: 'Patrick Murphy', appOwner: 'Marcus Taylor',
    cpof: 'Yes', riskRanking: 'High', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '2',
    productLine: 'Network Services', product: 'Network Automation', deploymentTypes: ['gap', 'gkp'] },
  { name: 'DNS & Load Balancer Service', seal: '80330', team: 'Traffic Eng', sla: '99.99%', incidents: 1, last: '5d ago',
    lob: 'IP', subLob: '', cto: 'Kumar Raghavan', cbt: 'Rachel Kim', appOwner: 'Frank Morrison',
    cpof: 'Yes', riskRanking: 'Critical', classification: 'In House', state: 'Operate', investmentStrategy: 'Invest', rto: '1',
    productLine: 'Network Services', product: 'DNS & Load Balancing', deploymentTypes: ['gap', 'gkp'] },
]

export const SUB_LOB_MAP = {
  AWM: ['Asset Management', 'AWM Shared', 'Global Private Bank'],
  CIB: ['Digital Platform and Services', 'Global Banking', 'Markets', 'Payments'],
}

// Filter fields organized by data source
// PATOOLS (Product Agility Tools): LOB → Sub LOB → Product Line → Product → Application
// V12: LOB → CTO → CBT → Application → component dependencies
export const FILTER_GROUPS = [
  { label: 'Organization', source: 'patools', keys: [
    { key: 'lob',         label: 'LOB' },
    { key: 'subLob',      label: 'Sub LOB' },
    { key: 'productLine', label: 'Product Line' },
    { key: 'product',     label: 'Product' },
  ]},
  { label: 'People', source: 'v12', keys: [
    { key: 'cto',      label: 'CTO' },
    { key: 'cbt',      label: 'CBT' },
    { key: 'appOwner', label: 'App Owner' },
  ]},
  { label: 'Application', keys: [
    { key: 'seal',               label: 'Application' },
    { key: 'cpof',               label: 'CPOF' },
    { key: 'riskRanking',        label: 'Risk Ranking' },
    { key: 'classification',     label: 'Classification' },
    { key: 'state',              label: 'State' },
    { key: 'investmentStrategy', label: 'Investment Strategy' },
    { key: 'rto',                label: 'RTO' },
  ]},
  { label: 'Infrastructure', keys: [
    { key: 'deployments', label: 'Deployment' },
  ]},
]

// Flat list for backward compat (ScopeBar iteration, etc.)
export const FILTER_FIELDS = FILTER_GROUPS.flatMap(g => g.keys)

// Auto-generate SEAL display from APPS
export const SEAL_DISPLAY = Object.fromEntries(
  APPS.map(a => [a.seal, `${a.name} - ${a.seal}`])
)

// Deployment type display labels
export const DEPLOY_TYPE_DISPLAY = {
  gap: 'GAP',
  gkp: 'GKP',
  ecs: 'ECS',
  eks: 'EKS',
  aws: 'AWS',
}

/**
 * Get available filter options for a given field.
 * @param {string} fieldKey — the field to get options for
 * @param {Array} candidateApps — apps matching all OTHER active filters (for cascading)
 * @param {Object} activeFilters — current active filters (for subLob → LOB dependency)
 */
export function getFilterOptions(fieldKey, candidateApps = APPS, activeFilters = {}) {
  if (fieldKey === 'subLob') {
    const selectedLobs = activeFilters.lob || []
    const lobsWithSubs = selectedLobs.length > 0
      ? selectedLobs.filter(l => SUB_LOB_MAP[l])
      : Object.keys(SUB_LOB_MAP)
    const validSubs = new Set(lobsWithSubs.flatMap(l => SUB_LOB_MAP[l]))
    return [...new Set(candidateApps.map(a => a.subLob).filter(v => v && validSubs.has(v)))].sort()
  }
  if (fieldKey === 'cpof') return ['Yes', 'No']
  if (fieldKey === 'seal') {
    return [...new Set(candidateApps.map(a => a.seal).filter(Boolean))]
      .sort()
      .map(s => SEAL_DISPLAY[s] || s)
  }
  if (fieldKey === 'deployments') {
    return candidateApps
      .flatMap(a => (a.deployments || []).map(d => `${d.label} - ${d.id}`))
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort()
  }
  return [...new Set(candidateApps.map(a => a[fieldKey]).filter(Boolean))].sort()
}

// Extract raw SEAL value from display format
export function parseSealDisplay(display) {
  const match = display.match(/- (\d+)$/)
  return match ? match[1] : display
}

// Extract deployment ID from display format "Label - ID"
export function parseDeployDisplay(display) {
  const match = display.match(/- (\d+)$/)
  return match ? match[1] : display
}
