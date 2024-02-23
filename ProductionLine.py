import simpy
import random

class Item:
    pass

class WorkStation:
    pass

class Item:
    def __init__(self) -> Item:
        self.stages_passed = []
        self.stages_left = [1, 2, 3, 4, 5, 6]
    def process(self, workstation_id : int) -> None:
        if workstation_id in self.stages_left:
            self.stages_left.remove(workstation_id)
            self.stages_passed.append(workstation_id)

class WorkStation:
    def __init__(self, _env: simpy.Environment, _resource: simpy.Resource, id : int, fail_rate : float, next_stations : list, _name : str) -> WorkStation :
        self.env : simpy.Environment = _env
        self.resource = resource
        self.action = self.env.process(self.run())
        self.raw_materials : int = 0
        self.next = next_stations
        self.item = None
        self.fail_rate : float = fail_rate
        self.id = id
        self.name = _name
        
        #KPIs
        self.wait_time = 0.0
        self.work_time = 0.0
        self.repair_time = 0.0
        self.total_time = 0.0
        
    def run(self) -> None: # type: ignore
        #Init some KPIs for output
        start_time = self.env.now
        while True:
            if self.id == 1:
                self.item = Item()
                
            if self.item is None:
                yield self.env.timeout(0.1) # Simply yield without a value to wait for an item
                continue
                
            if self.item:
                if random.random() <= self.fail_rate:
                    print(f"Station {self.id} Failure")
                    print(f"Station {self.id} started repairs at {self.env.now:.2f}")
                    yield self.env.timeout(random.normalvariate(3))
                    print(f"Station {self.id} finished repairs at {self.env.now:.2f}")
                    self.repair_time = self.repair_time + (self.env.now - start_time)
                    start_time = self.env.now
                if self.raw_materials > 0:
                    self.wait_time = self.env.now - start_time + self.wait_time
                    start_time = self.env.now
                    yield self.env.timeout(random.normalvariate(4))
                    self.item.process(self.id)
                    self.raw_materials = self.raw_materials - 1
                    print("Made item")
                    self.work_time = self.work_time + (self.env.now - start_time)
                    #TODO send item to next workstation
                    for station in self.next:
                        #TODO add a condition to check state of the station
                        station.item = self.item
                        continue
                    self.item = None
                    start_time = self.env.now
                #TODO add an else clause to wait for raw materials
                else:
                    print(f"Station {self.id} waiting for material at {self.env.now:.2f}")
                    yield self.env.timeout(random.normalvariate(4)) #TEMP test for adding materials
                    self.raw_materials = 25
                    print(f"Station {self.id} reloaded at {self.env.now:.2f}")
                    self.wait_time = self.env.now - start_time + self.wait_time
            
            
env = simpy.Environment()
resource = simpy.Resource(env, 3)

station2 = WorkStation(env, resource, 2, 0.20, [], "assembly")
station1 = WorkStation(env, resource, 1, 0.20, [station2], "assembly")
env.run(until=200)
print(f"Station {station1.id}:{station1.name} KPI")
print(f"Wait Time {station1.wait_time}, Work Time {station1.work_time}, Repair Time {station1.repair_time}, Total Time {station1.wait_time+station1.work_time+station1.repair_time}")
print(f"Station {station2.id}:{station2.name} KPI")
print(f"Wait Time {station2.wait_time}, Work Time {station2.work_time}, Repair Time {station2.repair_time}, Total Time {station2.wait_time+station2.work_time+station2.repair_time}")