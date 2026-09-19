from sqlalchemy import Column, Integer, String, Float
from geoalchemy2 import Geometry
from db.base import Base

class DemographicsBlock(Base):
    __tablename__ = 'demographics_blocks'
    __table_args__ = {'schema': 'raw'}

    geoid = Column(String, primary_key=True)
    population = Column(Integer)
    median_income = Column(Float)
    median_age = Column(Float)
    geom = Column(Geometry(srid=4326))

class Road(Base):
    __tablename__ = 'roads'
    __table_args__ = {'schema': 'raw'}

    osm_id = Column(String, primary_key=True)
    highway_class = Column(String)
    geom = Column(Geometry(srid=4326))

class TransitStop(Base):
    __tablename__ = 'transit_stops'
    __table_args__ = {'schema': 'raw'}

    osm_id = Column(String, primary_key=True)
    route_type = Column(String)
    geom = Column(Geometry(srid=4326))

class POI(Base):
    __tablename__ = 'pois'
    __table_args__ = {'schema': 'raw'}

    osm_id = Column(String, primary_key=True)
    category = Column(String)
    brand = Column(String)
    geom = Column(Geometry(srid=4326))

class LandUse(Base):
    __tablename__ = 'landuse'
    __table_args__ = {'schema': 'raw'}

    osm_id = Column(String, primary_key=True)
    zone_class = Column(String)
    geom = Column(Geometry(srid=4326))

class FloodZone(Base):
    __tablename__ = 'flood_zones'
    __table_args__ = {'schema': 'raw'}

    id = Column(Integer, primary_key=True, autoincrement=True)
    zone_code = Column(String)
    risk_level = Column(String)
    geom = Column(Geometry(srid=4326))

class AirQuality(Base):
    __tablename__ = 'air_quality'
    __table_args__ = {'schema': 'raw'}

    monitor_id = Column(String, primary_key=True)
    pollutant = Column(String)
    value = Column(Float)
    geom = Column(Geometry(srid=4326))

class H3Grid(Base):
    __tablename__ = 'h3_grid'
    __table_args__ = {'schema': 'derived'}

    h3_index = Column(String, primary_key=True)
    lat = Column(Float)
    lon = Column(Float)
    geom = Column(Geometry(srid=4326))
    score_retail = Column(Float)
    score_warehouse = Column(Float)
    score_ev = Column(Float)
    hotspot_z_retail = Column(Float)
    hotspot_z_warehouse = Column(Float)
    hotspot_z_ev = Column(Float)
