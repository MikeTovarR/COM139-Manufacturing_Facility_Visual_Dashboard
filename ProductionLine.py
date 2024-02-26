import simpy
import random
from collections import deque

class SimulationStop(Exception):
    pass

class Item:
    pass

class WorkStation:
    pass

class Item:
    def __init__(self) -> Item:
        self.stages_passed = [0]
        self.stages_left = [1, 2, 3, 4, 5, 6]
    def process(self, workstation_id : int) -> None:
        if workstation_id in self.stages_left:
            self.stages_left.remove(workstation_id)
            self.stages_passed.append(workstation_id)

class WorkStation:
    def __init__(self, _env: simpy.Environment, _resource: simpy.Resource, id : int, fail_rate : float, 
                 rejection_rate: float, accident_rate: float, _name : str) -> WorkStation :
        self.env : simpy.Environment = _env
        self.resource = resource
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
        
        #KPIs
        self.wait_time = 0.0
        self.work_time = 0.0
        self.repair_time = 0.0
        self.total_time = 0.0
        self.rejected_items = 0
        self.finished_items = 0
        
        
    def __repr__(self):
        return f"Station {self.id}:{self.name}"
        
    def add_next(self, next_station: list) -> None:
        self.next = next_station
    
    def reject_product(self) -> None:
        random_reject = random.random()
        if random_reject <= self.rejection_rate:
            print("Rejected product")
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
                self.item = Item()

            if not self.item:
                yield self.env.timeout(0.1) # Simply yield without a value to wait for an item
                continue
                
            if self.item:
                if random.random() <= self.fail_rate:
                    self.status = False
                    print(f"Station {self.id} Failure")
                    print(f"Station {self.id} started repairs at {self.env.now:.2f}")
                    yield self.env.timeout(abs(random.normalvariate(3)))
                    print(f"Station {self.id} finished repairs at {self.env.now:.2f}")
                    self.repair_time = self.repair_time + (self.env.now - start_time)
                    start_time = self.env.now
                if self.raw_materials > 0:
                    self.status = True
                    self.wait_time = self.env.now - start_time + self.wait_time
                    start_time = self.env.now
                    yield self.env.timeout(abs(random.normalvariate(4)))
                    self.item.process(self.id)
                    self.raw_materials = self.raw_materials - 1
                    print(f"Station {self.id} made item at {self.env.now:.4f}")
                    # Probability of product getting rejected
                    if self.id == 6:
                        self.finished_items += 1
                        self.reject_product()
                    self.work_time = self.work_time + (self.env.now - start_time)
                    start_time = self.env.now
                    # Send item to next workstation
                    passed_item = False
                    while not passed_item:
                        if not self.next:
                            passed_item = True
                        for station in self.next:
                            # Check state of the station
                            if station.item:
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
                                print(self.item.stages_left)
                                print(f"Cannot advance to station 6 (Bottleneck) at {self.env.now:.4f}")
                                continue
                            passed_item = True
                            station.item = self.item
                            self.item = None
                            print(f"Station {self.id} passed item to {station.id} at {self.env.now:.4f}")
                            break
                        #print("waiting")
                        yield self.env.timeout(0.1)
                # Wait for raw materials
                else:
                    self.status = True
                    print(f"Station {self.id} waiting for material at {self.env.now:.4f}")
                    with self.resource.request() as req:
                        yield req
                        print(f"Station {self.id} refilling at {self.env.now:.4f}")
                        yield self.env.timeout(abs(random.normalvariate(2)))  # Refilling time
                        self.raw_materials = 25
                        print(f"Station {self.id} refilled at {self.env.now:.4f}")
            
            # Accident
            if self.accident():
                print(f"Oh no! There was an accident and the production was stopped by today.\nProduction stopped at {self.env.now: .2f}")
                raise SimulationStop()
            
env = simpy.Environment()
resource = simpy.Resource(env, 3)

station1 = WorkStation(env, resource, 1, 0.20, 0.05, 0.01, "Manufacturing")
station2 = WorkStation(env, resource, 2, 0.10, 0.05, 0.01, "Assembly")
station3 = WorkStation(env, resource, 3, 0.15, 0.05, 0.01, "Assembly")
station4 = WorkStation(env, resource, 4, 0.05, 0.05, 0.01, "Quality control")
station5 = WorkStation(env, resource, 5, 0.07, 0.05, 0.01, "Testing")
station6 = WorkStation(env, resource, 6, 0.10, 0.05, 0.01, "Packaging")
station1.add_next([station2])
station2.add_next([station3])
station3.add_next([station4, station5])
station4.add_next([station5, station6])
station5.add_next([station4, station6])
# env.run(until=200)

try: 
    env.run(until=500)
except SimulationStop:
    print("Simulation stopped")

print(f"Station {station1.id}: {station1.name} KPI")
print(f"-- Wait Time {station1.wait_time:.2f}, Work Time {station1.work_time:.2f}, Repair Time {station1.repair_time:.2f}, Total Time {station1.wait_time+station1.work_time+station1.repair_time:.2f}")
print(f"Station {station2.id}: {station2.name} KPI")
print(f"-- Wait Time {station2.wait_time:.2f}, Work Time {station2.work_time:.2f}, Repair Time {station2.repair_time:.2f}, Total Time {station2.wait_time+station2.work_time+station2.repair_time:.2f}")
print(f"Station {station3.id}: {station3.name} KPI")
print(f"-- Wait Time {station3.wait_time:.2f}, Work Time {station3.work_time:.2f}, Repair Time {station3.repair_time:.2f}, Total Time {station3.wait_time+station3.work_time+station3.repair_time:.2f}")
print(f"Station {station4.id}: {station4.name} KPI")
print(f"-- Wait Time {station4.wait_time:.2f}, Work Time {station4.work_time:.2f}, Repair Time {station4.repair_time:.2f}, Total Time {station4.wait_time+station4.work_time+station4.repair_time:.2f}")
print(f"Station {station5.id}: {station5.name} KPI")
print(f"-- Wait Time {station5.wait_time:.2f}, Work Time {station5.work_time:.2f}, Repair Time {station5.repair_time:.2f}, Total Time {station5.wait_time+station5.work_time+station5.repair_time:.2f}")
print(f"Station {station6.id}: {station6.name} KPI")
print(f"-- Wait Time {station6.wait_time:.2f}, Work Time {station6.work_time:.2f}, Repair Time {station6.repair_time:.2f}, Total Time {station6.wait_time+station6.work_time+station6.repair_time:.2f}")
print(f"Finished products: {station6.finished_items}")
print(f"Rejected products: {station6.rejected_items}")
# python ProductionLine.py > output.txt