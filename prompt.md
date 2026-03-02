
Essential Services 
TradeMon
SRE Watchlist
Rapid Response
Incident Zero
Links
Customer Journeys
SLO Agent

Copy backend/main.py and backend/apps_registry.py to root
cd frontend && npm run build && cd ..
cf push

Please review the following to see if makes sense to explain the innerworking of this application. edit if needed. Then double check on the logic between backend and frontend to make sure data is normalized and from single source of truth, and is propogated accordingly. 
The goal is to prepare this application for API development to support getting live data. The expectation will be to have API documentation describing expected requirements, with very clear details and directions for developers to proceed.
Check for potential bugs or issues and report them accordingly.
Another goal is to prepare deployment of this app for demo purposes using mock data. 

Validation:
- confirm this application will maintain its data from single source of record
- current goal is to use mock data that is used throughout the system
- ensure there are no duplicate ways to source data that can cause conflict
- Hierarchy:
  - Business: LOB -> Sub-LOB -> Product Line -> Product -> Application
  - Technology: LOB -> CTO -> CBT -> Application
- Application is correlated to the Knowledge Graph of dependency managed by layers/nodes/edges
  - the relationship is: Application -> Deployment - Component
- Knowledge Graph nodes are defined in these layers/zones:
  - Component - core layer in the center
  - Upstream/Downstream - cross-application dependencies, will be represented with zones on the left/right respectively
  - Platform - technology platform where the component is deployed, will be represented with zone below the Component layer
  - Data Center - location and region where the component is hosted, will be represented with zone below the Platform layer 
  - Health Indicator - grouping of health indicator types that would be used RAG status, represented with zone above the Component layer
- Health Status is propogated within these hierarchies and dependencies
- Product Catalog API provides the Business hierarchy of LOB -> Sub-LOB -> Product Line -> Product -> Application
  - when there are no Sub-LOB within this hierarchy, it should be skipped
- ERMA or V12 or Knowledge Graph will provide the following mappings:
  - Essential Services -> Application -> Deployment
  - Business Process -> Application
- Service Now has API that provides Incident, Problem, and Change data, they will be correlated to Application and Deployment (noted as Configuration Item)
- AURA AI will connect to a streaming API for handling prompts and responses, it'll also be used for summarization purposes, such as:
  - AURA Summary in the Home page
  - Recurring Application issues - count, trend, over longer period of time
  - Blast Radius - Impact Severity, incident count/trend, and Executive Summary that focuses on business perspective
- For frontend
  - all of the pages and their elements should maintain their state and filtered scope, in order to maintain seamless user experience. The application should fully support browser back/forward.
  - it should also support mobile very well, at least for the home page.

Please write API documentation describing expected requirements, with very clear details and directions for developers to proceed.
Create a document around concepts and requirements described here, and save a new markdown file in root folder.