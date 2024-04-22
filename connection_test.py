from pymongo import MongoClient
import dns.resolver
dns.resolver.default_resolver=dns.resolver.Resolver(configure=False)
dns.resolver.default_resolver.nameservers=['8.8.8.8'] # this is a google public dns server,  use whatever dns server you like here
# as a test, dns.resolver.query('www.google.com') should return an answer, not an exception

connection_string = "mongodb+srv://0234500:dQ90cqBgNLLY6PKg@productionline.2brel6r.mongodb.net/"
client = MongoClient(connection_string)

# Test connection (you can replace this with your actual operations)
print(client.list_database_names())

client.close()