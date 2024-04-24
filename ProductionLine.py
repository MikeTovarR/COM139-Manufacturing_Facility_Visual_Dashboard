# Authors: Carlos Manuel Velez, Miguel Angel Tovar, Andres Martínez Cabrera

import simpy
import random
from collections import deque
import pandas as pd
from pymongo import MongoClient
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

# TO RUN 
# python ProductionLine.py > output.txt

app = Flask(__name__)
CORS(app)
class SimulationStop(Exception):
    pass

class Item:
    pass

class WorkStation:
    pass

class Item:
    def __init__(self, itemNo) -> Item:
        self.stages_passed = [0]
        self.stages_left = [1, 2, 3, 4, 5, 6]
        self.name = str(itemNo)
    def process(self, workstation_id : int) -> None:
        if workstation_id in self.stages_left:
            self.stages_left.remove(workstation_id)
            self.stages_passed.append(workstation_id)

class WorkStation:
    def __init__(self, _env: simpy.Environment, _resource: simpy.Resource, id : int, fail_rate : float, 
                 rejection_rate: float, accident_rate: float, _name : str) -> WorkStation :
        self.env : simpy.Environment = _env
        self.resource = _resource
        self.action = self.env.process(self.run())
        self.raw_materials : int = 25
        self.next = []
        self.item = None
        self.fail_rate : float = fail_rate
        self.rejection_rate : float = rejection_rate
        self.accident_rate : float = accident_rate
        self.id = id
        self.name = _name
        self.status = True
        self.done = False
        
        #KPIs
        self.wait_time = 0.0
        self.work_time = 0.0
        self.repair_time = 0.0
        self.supply_time = 0.0
        self.bottleneck_time = 0.0
        self.total_time = 0.0
        self.rejected_items = 0
        self.finished_items = 0

        self.itemNo = 0  
        self.reserved = False
        
    def __repr__(self):
        return f"Station {self.id}:{self.name}"
        
    def add_next(self, next_station: list) -> None:
        self.next = next_station
    
    def reject_product(self) -> None:
        random_reject = random.random()
        if random_reject <= self.rejection_rate:
            #print("Rejected product")
            self.rejected_items += 1
        
    def accident(self) -> bool:
        random_accident = random.random()
        if random_accident <= self.accident_rate:
            return True
        return False

    def run(self) -> None: # type: ignore
        #Init some KPIs for output
        start_time = self.env.now
        while True:
            if self.id == 1:
                self.itemNo += 1
                self.item = Item(self.itemNo)

            if not self.item:
                yield self.env.timeout(0.1) # Simply yield without a value to wait for an item
                continue
                
            if self.item:
                if abs(random.normalvariate()) <= self.fail_rate:
                    self.status = False
                    # print(f"Station {self.id} Failure")
                    # print(f"Station {self.id} started repairs at {self.env.now:.2f}")
                    yield self.env.timeout(abs(random.expovariate(3)))
                    #print(f"Station {self.id} finished repairs at {self.env.now:.2f}")
                    self.repair_time = self.repair_time + (self.env.now - start_time)
                    start_time = self.env.now
                if self.raw_materials > 0:
                    self.status = True
                    self.wait_time = self.env.now - start_time + self.wait_time
                    start_time = self.env.now
                    yield self.env.timeout(abs(random.normalvariate(4)))
                    self.item.process(self.id)
                    self.raw_materials = self.raw_materials - 1
                    #print(f"Station {self.id} made item at {self.env.now:.4f} named {self.item.name}")
                    self.finished_items += 1
                    # Probability of product getting rejected
                    if self.id == 6:
                        self.reject_product()
                    self.work_time = self.work_time + (self.env.now - start_time)
                    start_time = self.env.now
                    # The station finshed with the item
                    self.done = True
                    # Send item to next workstation
                    self.passed_item = False
                    while not self.passed_item:
                        start_time = self.env.now
                        if not self.next:
                            self.passed_item = True
                            self.item = None
                        for station in self.next:
                            # Check state of the station
                            if station.item:
                                # Switch items from stations 4 and 5
                                if not (((self.id==4 and station.id==5) or (self.id==5 and station.id==4)) and station.done):
                                    self.passed_item = True
                                    station.passed_item = True
                                    flagItem = station.item
                                    station.item = self.item
                                    self.item = flagItem
                                    # print(f"Station {self.id} passed item to {station.id} at {self.env.now:.4f}")
                                    # print(f"Station {station.id} passed item to {self.id} at {self.env.now:.4f}")
                                    # The station is empty
                                    self.done = False
                                    station.done = False
                                #print(f"Cannot advance to station {station.id} from {self.id} (Bottleneck) at {self.env.now:.4f}")
                                yield self.env.timeout(abs(random.normalvariate()))
                                self.bottleneck_time = self.env.now - start_time + self.bottleneck_time
                                start_time = self.env.now
                                continue
                            if station.id in self.item.stages_passed:
                                #print(self.id)
                                #print(f"{station.id} already processed here")
                                #print(self.next)
                                continue
                            if not station.status:
                                # print(self.id)
                                # print(f"{station.id} Machine broken")
                                continue
                            if station.id == 6 and len(self.item.stages_left) > 1:
                                #print(self.item.stages_left)
                                #print(f"Cannot advance to station 6 from {self.id} (Bottleneck) at {self.env.now:.4f}")
                                yield self.env.timeout(abs(random.normalvariate()))
                                self.bottleneck_time = self.env.now - start_time + self.bottleneck_time
                                start_time = self.env.now
                                continue
                            self.passed_item = True
                            station.item = self.item
                            self.item = None
                            #print(f"Station {self.id} passed item to {station.id} at {self.env.now:.4f}")
                            # The station is empty
                            self.done = False
                            break
                        #print("waiting")
                        yield self.env.timeout(0.1)
                # Wait for raw materials
                else:
                    self.status = True
                    #print(f"Station {self.id} waiting for material at {self.env.now:.4f}")
                    with self.resource.request() as req:
                        yield req
                        #print(f"Station {self.id} refilling at {self.env.now:.4f}")
                        start_time = self.env.now
                        yield self.env.timeout(abs(random.normalvariate(2)))  # Refilling time
                        self.supply_time = self.env.now - start_time + self.supply_time
                        start_time = self.env.now
                        self.raw_materials = 25
                        #print(f"Station {self.id} refilled at {self.env.now:.4f}")
            
            # Accident
            if self.accident():
                #print(f"Oh no! There was an accident and the production was stopped by today.\nProduction stopped at {self.env.now: .2f}")
                raise SimulationStop()

def run_production(period: int) -> pd.DataFrame:
    
    # Dict to define how many days will run each selected period
    periods = {"Day": 1, "Week": 7, "Month": 30, "Quarter": 120, "Year": 365}

    total_production = [0, 0, 0, 0, 0, 0]
    total_failure = 0
    total_occupancy = [0, 0, 0, 0, 0, 0]
    total_downtime = [0, 0, 0, 0, 0, 0]
    total_fix_time = [0, 0, 0, 0, 0, 0]
    total_bottleneck_time = [0, 0, 0, 0, 0, 0]
    total_waiting_time = [0, 0, 0, 0, 0, 0]

    days = periods[period]

    for day in range(days):
        #print(f"++++++++ Day {day+1} ++++++++")

        env = simpy.Environment()
        resource = simpy.Resource(env, 3)

        station1 = WorkStation(env, resource, 1, 0.20, 0.05, 0.0001, "Manufacturing")
        station2 = WorkStation(env, resource, 2, 0.10, 0.05, 0.0001, "Assembly")
        station3 = WorkStation(env, resource, 3, 0.15, 0.05, 0.0001, "Assembly")
        station4 = WorkStation(env, resource, 4, 0.05, 0.05, 0.0001, "Quality control")
        station5 = WorkStation(env, resource, 5, 0.07, 0.05, 0.0001, "Testing")
        station6 = WorkStation(env, resource, 6, 0.10, 0.05, 0.0001, "Packaging")
        station1.add_next([station2])
        station2.add_next([station3])
        station3.add_next([station4, station5])
        station4.add_next([station5, station6])
        station5.add_next([station4, station6])

        try: 
            env.run(until=500)
        except SimulationStop:
            print("Simulation stopped")

        #total_production += station6.finished_items
        total_production[0] += station1.finished_items
        total_production[1] += station2.finished_items
        total_production[2] += station3.finished_items
        total_production[3] += station4.finished_items
        total_production[4] += station5.finished_items
        total_production[5] += station6.finished_items

        total_failure += station6.rejected_items

        total_occupancy[0] += station1.work_time
        total_occupancy[1] += station2.work_time
        total_occupancy[2] += station3.work_time
        total_occupancy[3] += station4.work_time
        total_occupancy[4] += station5.work_time
        total_occupancy[5] += station6.work_time

        total_downtime[0] += station1.wait_time + station1.bottleneck_time
        total_downtime[1] += station2.wait_time + station2.bottleneck_time
        total_downtime[2] += station3.wait_time + station3.bottleneck_time
        total_downtime[3] += station4.wait_time + station4.bottleneck_time
        total_downtime[4] += station5.wait_time + station5.bottleneck_time
        total_downtime[5] += station6.wait_time + station6.bottleneck_time

        total_fix_time[0] += station1.repair_time
        total_fix_time[1] += station2.repair_time
        total_fix_time[2] += station3.repair_time
        total_fix_time[3] += station4.repair_time
        total_fix_time[4] += station5.repair_time
        total_fix_time[5] += station6.repair_time

        total_waiting_time[0] += station1.wait_time
        total_waiting_time[1] += station2.wait_time
        total_waiting_time[2] += station3.wait_time
        total_waiting_time[3] += station4.wait_time
        total_waiting_time[4] += station5.wait_time
        total_waiting_time[5] += station6.wait_time

        total_bottleneck_time[0] += station1.bottleneck_time
        total_bottleneck_time[1] += station2.bottleneck_time
        total_bottleneck_time[2] += station3.bottleneck_time
        total_bottleneck_time[3] += station4.bottleneck_time
        total_bottleneck_time[4] += station5.bottleneck_time
        total_bottleneck_time[5] += station6.bottleneck_time

        # total_fix_time += station1.repair_time + station2.repair_time + station3.repair_time + station4.repair_time + station5.repair_time + station6.repair_time

        # waiting_time = station1.wait_time + station2.wait_time + station3.wait_time + station4.wait_time + station5.wait_time + station6.wait_time
        #bottleneck_time = station1.bottleneck_time+station2.bottleneck_time+station3.bottleneck_time+station4.bottleneck_time+station5.bottleneck_time+station6.bottleneck_time
        #total_waiting_time += waiting_time + bottleneck_time
    """
    # prints of each run
        print(f"\nStation {station1.id}: {station1.name} KPI")
        print(f"-- Wait Time {station1.wait_time+station1.bottleneck_time:.2f}, Work Time {station1.work_time:.2f}, Repair Time {station1.repair_time:.2f}, Total Time {station1.wait_time+station1.work_time+station1.repair_time:.2f}")
        print(f"Station {station2.id}: {station2.name} KPI")
        print(f"-- Wait Time {station2.wait_time+station2.bottleneck_time:.2f}, Work Time {station2.work_time:.2f}, Repair Time {station2.repair_time:.2f}, Total Time {station2.wait_time+station2.work_time+station2.repair_time:.2f}")
        print(f"Station {station3.id}: {station3.name} KPI")
        print(f"-- Wait Time {station3.wait_time+station3.bottleneck_time:.2f}, Work Time {station3.work_time:.2f}, Repair Time {station3.repair_time:.2f}, Total Time {station3.wait_time+station3.work_time+station3.repair_time:.2f}")
        print(f"Station {station4.id}: {station4.name} KPI")
        print(f"-- Wait Time {station4.wait_time+station4.bottleneck_time:.2f}, Work Time {station4.work_time:.2f}, Repair Time {station4.repair_time:.2f}, Total Time {station4.wait_time+station4.work_time+station4.repair_time:.2f}")
        print(f"Station {station5.id}: {station5.name} KPI")
        print(f"-- Wait Time {station5.wait_time+station5.bottleneck_time:.2f}, Work Time {station5.work_time:.2f}, Repair Time {station5.repair_time:.2f}, Total Time {station5.wait_time+station5.work_time+station5.repair_time:.2f}")
        print(f"Station {station6.id}: {station6.name} KPI")
        print(f"-- Wait Time {station6.wait_time+station6.bottleneck_time:.2f}, Work Time {station6.work_time:.2f}, Repair Time {station6.repair_time:.2f}, Total Time {station6.wait_time+station6.work_time+station6.repair_time:.2f}")
        print(f"Supplier Device KPI")
        print(f"-- Work Time {station1.supply_time+station2.supply_time+station3.supply_time+station4.supply_time+station5.supply_time+station6.supply_time:.2f}")
        print(f"Fix Device")
        print(f"-- Fixing Time {station1.repair_time+station2.repair_time+station3.repair_time+station4.repair_time+station5.repair_time+station6.repair_time:.2f}")
        print(f"Bottleneck")
        print(f"-- Bottleneck Time {(bottleneck_time)/6:.6f}")
        print(f"Finished products: {station6.finished_items}")
        print(f"Rejected products: {station6.rejected_items}")
        print(f"Avarage faulty products: {station6.rejected_items}\n\n")
    """
    """   
    # prints after the runs end
    print(f"++++++++ After {days} days of production ++++++++")
    print(f"-- Average production per day: {total_production/days:.2f}")
    print(f"-- Average quality failures per day : {total_failure/days:.2f}")
    print(f"-- Average occupancy for each workstation per day: [{total_occupancy[0]/days:.2f}, {total_occupancy[1]/days:.2f}, {total_occupancy[2]/days:.2f}, {total_occupancy[3]/days:.2f}, {total_occupancy[4]/days:.2f}, {total_occupancy[5]/days:.2f}]")
    print(f"-- Average downtime  for each workstation per day: [{total_downtime[0]/days:.2f}, {total_occupancy[1]/days:.2f}, {total_occupancy[2]/days:.2f}, {total_occupancy[3]/days:.2f}, {total_occupancy[4]/days:.2f}, {total_occupancy[5]/days:.2f}]")
    print(f"-- Average fix time per day: {total_fix_time/days:.2f}")
    print(f"-- Average waiting time per day: {total_waiting_time/days:.2f}")

    """
    data_station1 = pd.DataFrame(columns=['STATION', 'PERIOD', 'PRODUCTION', 'OCCUPANCY', 'DOWNTIME', 'FIX_TIME', 'WAITING_TIME', 
                                              'BOTTLENECK_TIME'])
    data_station2 = pd.DataFrame(columns=['STATION', 'PERIOD', 'PRODUCTION', 'OCCUPANCY', 'DOWNTIME', 'FIX_TIME', 'WAITING_TIME', 
                                              'BOTTLENECK_TIME'])
    data_station3 = pd.DataFrame(columns=['STATION', 'PERIOD', 'PRODUCTION', 'OCCUPANCY', 'DOWNTIME', 'FIX_TIME', 'WAITING_TIME', 
                                              'BOTTLENECK_TIME'])
    data_station4 = pd.DataFrame(columns=['STATION', 'PERIOD', 'PRODUCTION', 'OCCUPANCY', 'DOWNTIME', 'FIX_TIME', 'WAITING_TIME', 
                                              'BOTTLENECK_TIME'])
    data_station5 = pd.DataFrame(columns=['STATION', 'PERIOD', 'PRODUCTION', 'OCCUPANCY', 'DOWNTIME', 'FIX_TIME', 'WAITING_TIME', 
                                              'BOTTLENECK_TIME'])
    data_station6 = pd.DataFrame(columns=['STATION', 'PERIOD', 'PRODUCTION', 'REJECTED', 'OCCUPANCY', 'DOWNTIME', 'FIX_TIME', 
                                          'WAITING_TIME', 'BOTTLENECK_TIME'])

    production_resume = [data_station1, data_station2, data_station3, data_station4, data_station5, data_station6]
    
    for i in range(6):
        if i < 5:
            production_resume[i].loc[len(production_resume[i])] = [i+1, period, total_production[i], total_occupancy[i], total_downtime[i], total_fix_time[i],
                                                            total_waiting_time[i], total_bottleneck_time[i]]
        else:
            production_resume[i].loc[len(production_resume[i])] = [i+1, period, total_production[i], total_failure, total_occupancy[i], total_downtime[i], total_fix_time[i],
                                                            total_waiting_time[i], total_bottleneck_time[i]]

    return production_resume

@app.route('/get_data', methods=['GET'])
def get_data():

    period = request.args.get('selected_period')

    connection_string = "mongodb+srv://production:production@productionline.2brel6r.mongodb.net/" # a Andrés sí le sirve
    # connection_string = "mongodb+srv://0234500:dQ90cqBgNLLY6PKg@productionline.2brel6r.mongodb.net/"
    client = MongoClient(connection_string)

    db = client["ProductionLine"]
    collection = db["Runs"]

    data = run_production(period) # Define the period of the run and store the result in a variable

    data_dict = {}
    stations_data = []

    for df in data:
        print(df)
        station_dict = df.to_dict()
        station_dict = {key: value[0] for key, value in station_dict.items()}
        stations_data.append(station_dict)

    now = datetime.now()
    date = now.strftime("%Y-%m-%d_%H-%M-%S")

    data_dict[f"{date}"] = stations_data
    collection.insert_one(data_dict)

    return "Success"

@app.route('/get_query', methods=['GET'])
def get_query():
    date = request.args.get('date')
    value = 'PRODUCTION'
    
    # Connect to the MongoDB database
    connection_string = "mongodb+srv://production:production@productionline.2brel6r.mongodb.net/"
    client = MongoClient(connection_string)
    db = client["ProductionLine"]
    collection = db["Runs"]

    # Query the Runs collection to get all documents
    runs = collection.find()

    # Convert the runs to a list of dictionaries
    run_dicts = list(runs)

    query = dict()
    # Convert the list of dictionaries into a single dictionary
    for run in run_dicts:
        try:
            query[date] = run[date]
            #result = {q['STATION']-1: q[value] for q in query}
            return jsonify(query)
        except:
            continue

    print(query)
    
    # Return the DataFrame
    return jsonify({})

# main()
if __name__ == '__main__':
    app.run(port=5000, debug=True)