# **trackr**
#### *Wirelessly track any remote location's temperature & humidity*

trackr helps in live monitoring of premises which could help facility admins in -

1. Reducing cooling costs at spots which might be cooler than required
2. Normalizing temperatures in premises thus reducing employee inconvenience
3. Keeping eye on crucial areas like server rooms, pantries/kitchen etc for overheating and avoid potential hazard/damage


It basically comprises of -

1. one or more probes (devices) and
2. a remote app

##### Probe
This piece of hardware that deploys at any premise, takes temperature and humidity readings and transmits them to remote app over wifi using web sockets.

Probe use a [Tessel board](https://www.tessel.io) ([v1.0](https://github.com/tessel/t1-docs))
along with it's [climate module](http://start.tessel.io/modules/climate).

##### Remote App
This app basically serves as a master for all the probes. It requests readings from probes, stores them and provides a frontend for controlling them.

It polls probes at regular intervals for readings. The poll can be started, stopped and their intervals be updated using the frontend.

The app and probes communicate via web sockets.

It uses an [Express](http://expressjs.com/en/index.html) server for serving frontend and [web socket](https://www.npmjs.com/package/nodejs-websocket) library for creating web sockets. 

#### Repo Structure
* [probe](probe) - All scripts related to probe hardware that are to be deployed on Tessel board
* [probe-troubleshoot](probe-troubleshoot) - Trouble shooting scripts to test individual probe functions
* [server](server) - Remote app related scripts

#### Setup

##### Probe
To setup the device, a system (desktop/laptop) is required to be installed with tools that are then used to push the scripts on the device.

The probe related scripts are located in [probe](probe).

###### Setting up a system
1. Install [NodeJS (v0.12)](https://nodejs.org/dist/v0.12.7/)
2. Install Tessel CLI

    ```
    $> npm install -g tessel
    ```
    
3. Fetch [probe scripts](probe)
4. Open Terminal and move to the scripts directory

    ```
    $> cd trackr/probe
    ```
    
5. Configure configs.json ([probe/configs.json](probe/configs.json)) with -
    1. probe's id, 
    2. remote location's wifi credentials and 
    3. remote app's ip address (and ports)
6. Install dependencies

    ```
    $> npm install
    ```
    
7. Attach Climate module to Tessel board (via port 'A') and connect Tessel board to the system via (MicroUSB -> USB) cable
8. Push scripts to Tessel board

    ```
    $> tessel push . 
    ```
    
9. Dettach cable from system and board

###### Remote App
Choose a system that will host the remote app and on it do these following setups -

1. Install [NodeJS (v0.12)](https://nodejs.org/dist/v0.12.7/)
2. Fetch [remote app scripts](server)
3. Open Terminal and move to the scripts directory

    ```
    $> cd trackr/server
    ```
    
4. Configure configs.json ([server/configs.json](server/configs.json)) (if required) -
 
    1. web server port (default 5000), 
    2. web socket port (default 9050)
5. Install dependencies

    ```
    $> npm install
    ```

#### Running Probe and Remote App
To run the complete application, ensure that -

1. setups of each component is done as described above and 
2. the probe and remote app connect to a (wifi)network from which they both are reachable to one another

###### Steps -

1. Run remote app
    1. Open Terminal and move to directory containing remote app
    
        ```
        $> cd tracker/server
        ```
        
    2. Start the server
    
        ```
        $> node index.js
        ```
        
2. Activate the probe
    
    Simply place the probe at a remote location where the environment is to be monitored and turn on the device either by using a compatible power bank or external power outlet and a microUSB charger.
    
    Probe then executes the previously "pushed" scripts, connects to pre-configured wifi and waits for requests from remote app.
    
3. Using frontend, administer the probes -
    1. Configure polling interval
    2. Begin polling using 'Start' button
    3. Get readings using 'Get/Update Readings' or 'Auto Fetch' buttons
    4. To stop polling, use 'Stop' button

#### License
The source and other artifacts here are provided under [MIT License](LICENSE) or their respective licenses, if mentioned. 

A link back here would be highly appreciated.
