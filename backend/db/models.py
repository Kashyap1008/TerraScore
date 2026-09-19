from sqlalchemy import Column, Integer, String, Float, BigInteger
from geoalchemy2 import Geometry
from db.base import Base

class DemographicsBlock(Base):
    __tablename__ = 'demographics_blocks'
    __table_args__ = {'schema': 'raw'}

    geoid = Column(String, primary_key=True)
    population = Column(Integer)
    median_income = Column(Integer)
    median_age = Column(Float)
    geom = Column(Geometry(srid=4326))

class Road(Base):
    __tablename__ = 'roads'
    __table_args__ = {'schema': 'raw'}

    osm_id = Column(BigInteger, primary_key=True)
    highway_class = Column(String)
    geom = Column(Geometry('LINESTRING', srid=4326))

class TransitStop(Base):
    __tablename__ = 'transit_stops'
    __table_args__ = {'schema': 'raw'}

    osm_id = Column(BigInteger, primary_key=True)
    route_type = Column(String)
    geom = Column(Geometry('POINT', srid=4326))

class POI(Base):
    __tablename__ = 'pois'
    __table_args__ = {'schema': 'raw'}

    osm_id = Column(BigInteger, primary_key=True)
    category = Column(String)
    brand = Column(String)
    geom = Column(Geometry('POINT', srid=4326))

class LandUse(Base):
    __tablename__ = 'landuse'
    __table_args__ = {'schema': 'raw'}

    osm_id = Column(BigInteger, primary_key=True)
    zone_class = Column(String)
    geom = Column(Geometry('POLYGON', srid=4326))

class FloodZone(Base):
    __tablename__ = 'flood_zones'
    __table_args__ = {'schema': 'raw'}

    id = Column(Integer, primary_key=True)
    zone_code = Column(String)
    risk_level = Column(String)
    geom = Column(Geometry('POLYGON', srid=4326))

class AirQuality(Base):
    __tablename__ = 'air_quality'
    __table_args__ = {'schema': 'raw'}

    monitor_id = Column(String, primary_key=True)
    pollutant = Column(String)
    value = Column(Float)
    geom = Column(Geometry('POINT', srid=4326))

class H3Grid(Base):
    __tablename__ = 'h3_grid'
    __table_args__ = {'schema': 'derived'}

    h3_index = Column(String, primary_key=True)
    lat = Column(Float)
    lon = Column(Float)
    geom = Column(Geometry('POLYGON', srid=4326))
    
    pop_density = Column(Float)
    pop_10min = Column(Integer)
    pop_20min = Column(Integer)
    pop_30min = Column(Integer)
    median_income = Column(Float)
    median_age = Column(Float)
    road_density = Column(Float)
    dist_to_highway_m = Column(Float)
    transit_count_800m = Column(Integer)
    competitor_count_1km = Column(Integer)
    competitor_decay_score = Column(Float)
    anchor_count_1km = Column(Integer)
    zone_class = Column(String)
    zone_suitability = Column(Float)
    flood_risk = Column(Float)
    aqi_score = Column(Float)
    
    score_retail = Column(Float)
    score_warehouse = Column(Float)
    score_ev = Column(Float)
    hotspot_z_retail = Column(Float)
    hotspot_z_warehouse = Column(Float)
    hotspot_z_ev = Column(Float)
