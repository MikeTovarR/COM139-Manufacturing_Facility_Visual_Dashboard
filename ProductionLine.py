import simpy
import random

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
    def __init__(self, _env: simpy.Environment, _resource: simpy.Resource, id : int, fail_rate : float, _name : str) -> WorkStation :
        self.env : simpy.Environment = _env
        self.resource = resource
        self.action = self.env.process(self.run())
        self.raw_materials : int = 25
        self.next = []
        self.item = None
        self.fail_rate : float = fail_rate
        self.id = id
        self.name = _name
        self.status = True
        
        #KPIs
        self.wait_time = 0.0
        self.work_time = 0.0
        self.repair_time = 0.0
        self.total_time = 0.0
        
    def __repr__(self):
        return f"Station {self.id}:{self.name}"
        
    def add_next(self, next_station: list) -> None:
        self.next = next_station
        
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
                    self.status = False
                    print(f"Station {self.id} Failure")
                    print(f"Station {self.id} started repairs at {self.env.now:.2f}")
                    yield self.env.timeout(random.normalvariate(3))
                    print(f"Station {self.id} finished repairs at {self.env.now:.2f}")
                    self.repair_time = self.repair_time + (self.env.now - start_time)
                    start_time = self.env.now
                if self.raw_materials > 0:
                    self.status = True
                    self.wait_time = self.env.now - start_time + self.wait_time
                    start_time = self.env.now
                    yield self.env.timeout(random.normalvariate(4))
                    self.item.process(self.id)
                    self.raw_materials = self.raw_materials - 1
                    print(f"Station {self.id} made item at {self.env.now}")
                    self.work_time = self.work_time + (self.env.now - start_time)
                    start_time = self.env.now
                    #TODO send item to next workstation
                    passed_item = False
                    while not passed_item:
                        if not self.next:
                            passed_item = True
                        for station in self.next:
                            #TODO add a condition to check state of the station
                            if station.id in self.item.stages_passed:
                                print(self.id)
                                print(f"{station.id} already processed here")
                                print(self.next)
                                continue
                            if station.item:
                                print(self.id)
                                print(f"{station.id} has an item")
                                print(self.next)
                                continue
                            if not station.status:
                                print(self.id)
                                print(f"{station.id} Machine broken")
                                continue
                            passed_item = True
                            station.item = self.item
                            print("broken")
                            break
                        print("waiting")
                        yield self.env.timeout(0.1)
                    self.item = None
                #TODO add an else clause to wait for raw materials
                else:
                    self.status = True
                    print(f"Station {self.id} waiting for material at {self.env.now:.2f}")
                    with self.resource.request() as req:
                        yield req
                        print(f"Station {self.id} refilling at {self.env.now:.2f}")
                        yield self.env.timeout(random.normalvariate(2))  # Refilling time
                        self.raw_materials = 25
                        print(f"Station {self.id} refilled at {self.env.now:.2f}")
            
            
env = simpy.Environment()
resource = simpy.Resource(env, 3)

station1 = WorkStation(env, resource, 1, 0.20, "manufacturing")
station2 = WorkStation(env, resource, 2, 0.10, "assembly")
station3 = WorkStation(env, resource, 3, 0.15, "assembly")
station4 = WorkStation(env, resource, 4, 0.05, "quality control")
station5 = WorkStation(env, resource, 5, 0.07, "testing")
station6 = WorkStation(env, resource, 6, 0.10, "packaging")
station1.add_next([station2])
station2.add_next([station3])
station3.add_next([station4, station5])
station4.add_next([station5, station6])
station5.add_next([station4, station6])
env.run(until=200)
print(f"Station {station1.id}:{station1.name} KPI")
print(f"Wait Time {station1.wait_time:.2f}, Work Time {station1.work_time:.2f}, Repair Time {station1.repair_time:.2f}, Total Time {station1.wait_time+station1.work_time+station1.repair_time:.2f}")
print(f"Station {station2.id}:{station2.name} KPI")
print(f"Wait Time {station2.wait_time:.2f}, Work Time {station2.work_time:.2f}, Repair Time {station2.repair_time:.2f}, Total Time {station2.wait_time+station2.work_time+station2.repair_time:.2f}")
print(f"Station {station3.id}:{station3.name} KPI")
print(f"Wait Time {station3.wait_time:.2f}, Work Time {station3.work_time:.2f}, Repair Time {station3.repair_time:.2f}, Total Time {station3.wait_time+station3.work_time+station3.repair_time:.2f}")
print(f"Station {station4.id}:{station4.name} KPI")
print(f"Wait Time {station4.wait_time:.2f}, Work Time {station4.work_time:.2f}, Repair Time {station4.repair_time:.2f}, Total Time {station4.wait_time+station4.work_time+station4.repair_time:.2f}")
print(f"Station {station5.id}:{station5.name} KPI")
print(f"Wait Time {station5.wait_time:.2f}, Work Time {station5.work_time:.2f}, Repair Time {station5.repair_time:.2f}, Total Time {station5.wait_time+station5.work_time+station5.repair_time:.2f}")
print(f"Station {station6.id}:{station6.name} KPI")
print(f"Wait Time {station6.wait_time:.2f}, Work Time {station6.work_time:.2f}, Repair Time {station6.repair_time:.2f}, Total Time {station6.wait_time+station6.work_time+station6.repair_time:.2f}")