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
    def __init__(self, _env: simpy.Environment, _resource: simpy.Resource, id : int, fail_rate : float, next_stations : list) -> WorkStation :
        self.env : simpy.Environment = _env
        self.resource = resource
        self.action = self.env.process(self.run())
        self.raw_materials : int = 25
        self.next = next_stations
        self.item = None
        self.fail_rate : float = fail_rate
        self.id = id
        
    def process_item(self):
        if self.id == 1:
            self.item = Item()
        if random.random() <= self.fail_rate:
            print(f"Station {self.id} Failure")
            print(f"Station {self.id} started repairs at {self.env.now:.2f}")
            yield self.env.timeout(random.normalvariate(3))
            print(f"Station {self.id} finished repairs at {self.env.now:.2f}") 
        if self.item and self.raw_materials:
            yield self.env.timeout(random.normalvariate(4))
            self.item.process(self.id)
            self.raw_materials = self.raw_materials - 1
            print("Made item")
        else:
            print("No item")
        
    def run(self) -> None: # type: ignore
        while True:
            if self.id == 1:
                self.item = Item()
            if random.random() <= self.fail_rate:
                print(f"Station {self.id} Failure")
                print(f"Station {self.id} started repairs at {self.env.now:.2f}")
                yield self.env.timeout(random.normalvariate(3))
                print(f"Station {self.id} finished repairs at {self.env.now:.2f}") 
            if self.item and self.raw_materials:
                yield self.env.timeout(random.normalvariate(4))
                self.item.process(self.id)
                self.raw_materials = self.raw_materials - 1
                print("Made item")
            else:
                print("No item")
            
            
env = simpy.Environment()
resource = simpy.Resource(env, 3)

station1 = WorkStation(env, resource, 1, 0.20, [2])
env.run(until=200)